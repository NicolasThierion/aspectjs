import { abstract } from '@aspectjs/common/utils';
import { PathVariable } from '../src/annotations/path-variable.annotation';
import { Get, HttypedClient, RequestParam } from '../src/public_api';

@HttypedClient()
export abstract class UsersApi {
  @Get('users')
  getAll() {
    return abstract<User[]>();
  }

  @Get('users/:id', {
    // responseMapper: (r) => new User(r.json())
  })
  // @Type(User)
  // @Type([User])
  getOne(@PathVariable('id') _id: number) {
    // return abstract.any(User);
    // return abstract.any([User]);
    // return abstract(new User());
    // return abstract([new User()]);
    return abstract<User>();
  }

  @Get('users')
  searchByName(@RequestParam('name') _name: string) {
    return abstract<User[]>();
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
