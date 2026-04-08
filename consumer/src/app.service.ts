import { Injectable } from '@nestjs/common';

export type ConsumerResponse = {
  status: string;
  processedMessage: string;
  processedAt: string;
};

@Injectable()
export class AppService {
  processMessage(message: string): ConsumerResponse {
    return {
      status: 'processed',
      processedMessage: `Consumer recibio: ${message}`,
      processedAt: new Date().toISOString(),
    };
  }

  getHello(): string {
    return 'Hello World!';
  }
}
