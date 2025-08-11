import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller('products')
export class ProductsController {
  @MessagePattern('get-product')
  getProduct(id: number) {
    console.log('GET PRODUCT REQ ON PRODUCT MICROSERVICE');
    return {id, name: 'Product Name', price: 100};
  }
  @MessagePattern('order-created')
  updateProduct(order: any) {
    return {message: 'Product updated successfully', order };
  }
  @EventPattern('event.order.created')
  async updateStock(order: any) {
    console.log('ORDER CREATED EVENT RECEIVED IN PRODUCTS MICROSERVICE VIA REDIS CLIENT');
  }
}
