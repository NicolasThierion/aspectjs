import { abstract } from '@aspectjs/common/utils';
import { PathVariable } from '../src/annotations/path-variable.annotation';
import { Get, HttypedClient } from '../src/public_api';
import { User } from './user';

@HttypedClient()
export abstract class UsersApi {
  @Get('users/:id')
  getOne(@PathVariable('id') _id: number) {
    return abstract<[User]>();
  }
}
