import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  UserRequest,
  UserResponse,
  UserServiceController,
  UserServiceControllerMethods,
} from '../assets/types/proto/users';
@Controller('users')
@UserServiceControllerMethods()
export class UsersController implements UserServiceController {
  getUser(
    request: UserRequest
  ): Promise<UserResponse> | Observable<UserResponse> | UserResponse {
    return {
      usertId: 12,
      name: 'Laptop',
      age: 60,
    };
  }
}
