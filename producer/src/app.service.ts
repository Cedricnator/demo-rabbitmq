import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

type ConsumerResponse = {
  status: string;
  processedMessage: string;
  processedAt: string;
};

export type ProducerResponse = {
  producerStatus: string;
  sentMessage: string;
  consumerResponse: ConsumerResponse;
};

@Injectable()
export class AppService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async sendToConsumer(message: string): Promise<ProducerResponse> {
    const consumerResponse = await firstValueFrom(
      this.rabbitClient
        .send<ConsumerResponse, { message: string }>('demo_queue', { message })
        .pipe(timeout(5000)),
    );

    return {
      producerStatus: 'message sent',
      sentMessage: message,
      consumerResponse,
    };
  }
}
