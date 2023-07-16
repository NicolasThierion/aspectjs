import { Get, HttpClient } from '../src/public_api';
import { PathVariable } from './../src/annotations/path-variable.annotation';
import { User } from './user';

@HttpClient('https://jsonplaceholder.typicode.com')
export class UsersApi {
  @Get('users/:id')
  getOne(@PathVariable('id') _id: number) {
    return [new User()];
  }
}
