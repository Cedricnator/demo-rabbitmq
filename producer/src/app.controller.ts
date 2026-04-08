import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('send')
  sendMessage(@Query('message') message?: string) {
    return this.appService.sendToConsumer(message ?? 'Mensaje de prueba');
  }
}
