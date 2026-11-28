/**
 * Reproduction test for @nestjs/core v12.6.3 route-conflict detection.
 *
 * v12.6.3 (nestjs/nest#18721) makes duplicate-route detection compare paths
 * the way the router matches them: on Express — which matches paths in any
 * case — `GET /users` and `GET /Users` are the same route, so `duplicate:
 * 'error'` aborts bootstrap. Case-sensitive routers (Fastify by default, the
 * Node adapter, Express with `case sensitive routing`) keep them distinct.
 *
 * apps/api-gateway/src/main.ts boots the app with `new ExpressAdapter()`, so
 * the Express rules are the ones that apply to this repository.
 *
 * Runs with `npm test` (node:test, built into Node, no new dependency).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const DETECTOR = '@nestjs/core/router/route-conflict-detector.js';

async function detector() {
  const mod = await import(DETECTOR);
  return mod.RouteConflictDetector;
}

async function httpGet() {
  const mod = await import('@nestjs/common');
  return (mod.default ?? mod).RequestMethod.GET;
}

// Minimal stand-ins for Nest's ResolvedRoute: the detector only reads the
// method, path, host, version and instance labels when it looks for overlap.
const route = (path, method, methodName) => ({
  path,
  method,
  host: undefined,
  version: undefined,
  instanceWrapper: { name: `Synthetic${methodName}` },
  methodName,
});

test('an Express (case-insensitive) router reports GET /users and GET /Users as duplicates', async () => {
  const RouteConflictDetector = await detector();
  const GET = await httpGet();

  const conflicts = RouteConflictDetector.detect(
    [route('/users', GET, 'listLower'), route('/Users', GET, 'listUpper')],
    undefined,
    false // the router matches paths in any case (Express default)
  );

  assert.equal(conflicts.length, 1, 'the two spellings must be one route');
  assert.equal(conflicts[0].kind, 'duplicate');
  assert.equal(conflicts[0].winner.methodName, 'listLower');
  assert.equal(conflicts[0].shadowed.methodName, 'listUpper');
});

test('a case-sensitive router keeps GET /users and GET /Users distinct', async () => {
  const RouteConflictDetector = await detector();
  const GET = await httpGet();

  const routes = [
    route('/users', GET, 'listLower'),
    route('/Users', GET, 'listUpper'),
  ];

  assert.deepEqual(
    RouteConflictDetector.detect(routes, undefined, true),
    [],
    'a case-sensitive router (Fastify default, Node adapter) serves both'
  );
  assert.deepEqual(
    RouteConflictDetector.detect(routes, undefined),
    [],
    'the default stays case-sensitive'
  );
});

test('identical paths are still reported as duplicates in both modes', async () => {
  const RouteConflictDetector = await detector();
  const GET = await httpGet();

  const routes = [
    route('/users', GET, 'listFirst'),
    route('/users', GET, 'listSecond'),
  ];

  for (const caseSensitive of [true, false]) {
    const conflicts = RouteConflictDetector.detect(routes, undefined, caseSensitive);
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].kind, 'duplicate');
  }
});
