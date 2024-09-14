import { abstract } from '@aspectjs/common/utils';
import { PathVariable } from '../src/annotations/path-variable.annotation';
import { TypeHint } from '../src/annotations/type.annotation';
import { Get, HttypedClient, RequestParam } from '../src/public_api';

@HttypedClient()
export abstract class UsersApi {
  @Get('users')
  @TypeHint([User])
  getAll() {
    return abstract<User[]>();
  }

  @Get('users/:id', {})
  getOne(@PathVariable('id') _id: number) {
    return abstract<User>(User);
  }

  @Get('users')
  searchByUserName(@RequestParam('username') _name: string) {
    return abstract([User]);
  }
}

export class User {
  id!: number;
  name!: string;
  username!: string;
  email!: string;
  address!: Address;

  phone!: string;
  website!: string;
  company!: Company;
}

export class Address {
  street!: string;
  suite!: string;
  city!: string;
  zipcode!: string;

  print() {
    return `${this.street}, ${this.suite}, ${this.zipcode} ${this.city}`;
  }
}

export class Company {
  name!: string;
  catchPhrase!: string;
  bs!: string;
}
