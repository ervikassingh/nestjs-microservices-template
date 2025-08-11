import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern('topic.message')
    createOrder(@Payload() message: any) {
      console.log(message);
      console.log('TOPIC RECEIVED ON ORDER MICROSERVICE VIA KAFKA CLIENT');
    }
}
