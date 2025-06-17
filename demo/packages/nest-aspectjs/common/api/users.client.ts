import { Controller } from '@nestjs/common';
import { NestClient } from 'nestjs-httyped-client';
import { UsersApi } from './users.api';

@Controller()
@NestClient('users')
export abstract class UsersClient extends UsersApi {}
