import { Controller, Get } from '@nestjs/common';

@Controller('api/v1')
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      runtime: 'Bun.js v1.4',
      framework: 'NestJS on Fastify Engine',
      timestamp: new Date().toISOString(),
      service: 'Unified POS & SaaS Backend Engine',
    };
  }
}
