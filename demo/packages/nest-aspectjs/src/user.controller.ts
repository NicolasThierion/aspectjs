import { Controller } from '@aspectjs/nestjs/common';
import { UsersApi } from '../common/api/users.api';
import { Address } from '../common/models/address.model';
import { User } from '../common/models/user.model';

@Controller('users')
export class UserController extends UsersApi {
  override async find(username?: string) {
    return Object.values(USERS).filter((u) =>
      u.name.match(new RegExp(`${username ?? ''}`, 'gi')),
    );
  }

  override async getById(id: number) {
    return USERS[id];
  }

  override async getUsersPosts(userId: number) {
    return USERS[userId].posts;
  }

  override async create(user: User) {
    const currentId = Object.keys(USERS).sort((a, b) => +b - +a)[0] ?? 0;
    USERS[user.id ?? +currentId + 1];
    return;
  }
}

const USERS: Record<number, User> = {
  1: new User({
    id: 1,
    name: 'Joe DALTON',
    username: 'jdalton',
    email: 'joe.dalton@alcatraz.com',
    address: new Address({
      city: 'San Francisco',
      street: '1 random road',
      zipcode: '123',
    }),
    phone: '123',
  }),
  2: new User({
    id: 2,
    name: 'Jack DALTON',
    username: 'jadalton',
    email: 'jack.dalton@alcatraz.com',
    address: new Address({
      city: 'San Francisco',
      street: '1 random road',
      zipcode: '123',
    }),
    phone: '123',
  }),
  3: new User({
    id: 3,
    name: 'William DALTON',
    username: 'wdalton',
    email: 'william.dalton@alcatraz.com',
    address: new Address({
      city: 'San Francisco',
      street: '1 random road',
      zipcode: '123',
    }),
    phone: '123',
  }),
  4: new User({
    id: 4,
    name: 'Avrell DALTON',
    username: 'adalton',
    email: 'avrell.dalton@alcatraz.com',
    address: new Address({
      city: 'San Francisco',
      street: '1 random road',
      zipcode: '123',
    }),
    phone: '123',
  }),
};
