/**
 * Reproduction test for the vendor updates:
 *   @nestjs/common 11.1.3 -> 12.6.2
 *   @nestjs/core 11.1.3 -> 12.6.2
 *   @nestjs/microservices 11.1.3 -> 12.6.2
 *
 * Runs with the repository's own test command (`npm test`, wired below) using
 * node:test, which is built into Node, plus the already-installed
 * `reflect-metadata` and `@nestjs/*` packages. No new dependency is required.
 *
 * Run it directly with: node --test test/
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const MINIMUM_VERSION = [12, 6, 2];

function isAtLeast(version, minimum) {
  const actual = version.split('-')[0].split('.').map(Number);
  for (let i = 0; i < minimum.length; i += 1) {
    if ((actual[i] ?? 0) > minimum[i]) return true;
    if ((actual[i] ?? 0) < minimum[i]) return false;
  }
  return true;
}

test('@nestjs/common is at least v12.6.2 and its call-site decorators keep their contract', async () => {
  // 1. The vendor pin: the installed package must be v12.6.2 or newer.
  //    On the pre-fix code (@nestjs/common 11.1.3/12.6.0) this assertion fails.
  const require = createRequire(import.meta.url);
  const { version } = require('@nestjs/common/package.json');
  assert.ok(
    isAtLeast(version, MINIMUM_VERSION),
    `@nestjs/common must be >= 12.6.2 per the vendor update, installed: ${version}`
  );

  // 2. Guard the behaviour that must not change: every @nestjs/common export
  //    used at the flagged call sites (controllers, modules, services,
  //    main.ts) is still exported and still records the same runtime
  //    metadata when applied to a synthetic class.
  await import('reflect-metadata');
  const imported = await import('@nestjs/common');
  const common = imported.default ?? imported;

  for (const name of [
    'Controller',
    'Get',
    'Post',
    'Body',
    'Inject',
    'Injectable',
    'Module',
    'Logger',
  ]) {
    assert.equal(
      typeof common[name],
      'function',
      `@nestjs/common must still export ${name}`
    );
  }

  // Class-level decorator used by every controller/module in the apps.
  const controller = common.Controller('synthetic-route');
  class Synthetic {
    handler() {}
  }
  controller(Synthetic);
  assert.equal(
    Reflect.getMetadata('path', Synthetic),
    'synthetic-route',
    '@Controller must still record its route path metadata'
  );

  // Method-level route decorator used by @Get/@Post at the call sites.
  const descriptor = Object.getOwnPropertyDescriptor(
    Synthetic.prototype,
    'handler'
  );
  common.Get('synthetic-sub')(Synthetic.prototype, 'handler', descriptor);
  const methodPath =
    Reflect.getMetadata('path', descriptor.value) ??
    Reflect.getMetadata('path', Synthetic.prototype);
  assert.equal(
    methodPath,
    'synthetic-sub',
    '@Get must still record its route path metadata'
  );

  // Module/Injectable/Inject still apply to a synthetic class without error.
  const moduleDecorator = common.Module({ imports: [], controllers: [] });
  class SyntheticModule {}
  moduleDecorator(SyntheticModule);
  common.Injectable()(SyntheticModule);
  common.Inject('SYNTHETIC_TOKEN')(SyntheticModule, 'handler');
  assert.ok(new common.Logger('synthetic'), 'Logger must still be constructible');
});

test('@nestjs/core and @nestjs/microservices are at least v12.6.2 and keep their call-site contracts', async () => {
  // 1. The vendor pins: both installed packages must be v12.6.2 or newer.
  //    On the pre-fix code (12.6.0) these assertions fail.
  const require = createRequire(import.meta.url);
  for (const pkg of ['@nestjs/core', '@nestjs/microservices']) {
    const { version } = require(`${pkg}/package.json`);
    assert.ok(
      isAtLeast(version, MINIMUM_VERSION),
      `${pkg} must be >= 12.6.2 per the vendor update, installed: ${version}`
    );
  }

  // 2. Guard the behaviour that must not change: the @nestjs/core call site
  //    in apps/api-gateway/src/main.ts still has NestFactory.create and the
  //    adapter contract it relies on.
  await import('reflect-metadata');
  const coreImported = await import('@nestjs/core');
  const core = coreImported.default ?? coreImported;
  assert.equal(
    typeof core.NestFactory?.create,
    'function',
    '@nestjs/core must still export NestFactory.create'
  );
  assert.equal(
    typeof core.AbstractHttpAdapter,
    'function',
    '@nestjs/core must still export AbstractHttpAdapter for adapter inference'
  );

  // 3. Guard every @nestjs/microservices runtime export used at the flagged
  //    call sites (clients, message/event decorators and transport enum).
  const microservicesImported = await import('@nestjs/microservices');
  const microservices = microservicesImported.default ?? microservicesImported;
  for (const name of [
    'ClientsModule',
    'ClientProxy',
    'ClientKafka',
    'MessagePattern',
    'EventPattern',
    'Payload',
  ]) {
    assert.equal(
      typeof microservices[name],
      'function',
      `@nestjs/microservices must still export ${name}`
    );
  }
  assert.deepEqual(
    {
      TCP: microservices.Transport?.TCP,
      REDIS: microservices.Transport?.REDIS,
      GRPC: microservices.Transport?.GRPC,
      KAFKA: microservices.Transport?.KAFKA,
    },
    { TCP: 0, REDIS: 1, GRPC: 4, KAFKA: 6 },
    '@nestjs/microservices Transport enum values must stay stable'
  );
});
