import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { MICROSERVICES_CLIENTS } from '../constants';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.PRODUCT_REDIS_CLIENT)
    private productRedisClient: ClientProxy
  ) {}
  @MessagePattern('create-order')
  createOrder(order: any) {
    console.log('ORDER RECEIVED ON ORDER MICROSERVICE');

    this.productRedisClient.emit('event.order.created', order); // Asynchronously
    // return this.productRedisClient.send('order-created', order); // Synchronously 

    return {message: 'Order created successfully', order };
  }
}
