import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientKafka } from '@nestjs/microservices';
import { MICROSERVICES_CLIENTS } from '../constants';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(MICROSERVICES_CLIENTS.KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('emit-topic')
  emitTopic(@Body() message: any) {
    console.log('EMIT TOPIC API HIT ON API GATEWAY');

    this.kafkaClient.emit('topic.message', message);

    return { message: 'Topic emitted successfully' };
  }
}
