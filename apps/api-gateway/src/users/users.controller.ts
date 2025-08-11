import { Controller, Get, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  USERS_PACKAGE_NAME,
  USER_SERVICE_NAME,
  UserServiceClient,
} from '../assets/types/proto/users';

@Controller('users')
export class UsersController {
  private userService: UserServiceClient;

  constructor(
    @Inject(USERS_PACKAGE_NAME)
    private client: ClientGrpc
  ) {
    this.userService =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  @Get()
  getUser() {
    console.log('GET USER API HIT ON API GATEWAY');

    return this.userService.getUser({ userId: 1 });
  }
}
