import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('root')
@Controller('')
export class RootController {
  @Get()
  @ApiOperation({ summary: 'Service information' })
  @ApiResponse({ status: 200, description: 'Service information' })
  getServiceInfo() {
    return {
      message: 'Ideal Weddings Auth Service',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/docs',
        auth: '/api/v1/auth',
        users: '/api/v1/users'
      }
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString()
    };
  }
} 