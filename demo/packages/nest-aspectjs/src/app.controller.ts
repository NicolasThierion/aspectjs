import { Controller, Get, Query } from '@aspectjs/nestjs/common';

@Controller('hello')
export class AppController {
  constructor() {}

  @Get()
  getHello(@Query('who') who: string): string {
    return `Hello ${who}`;
  }
}
