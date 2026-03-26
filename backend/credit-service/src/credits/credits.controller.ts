import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { PurchaseCreditsDto, UseCreditsDto } from './dto/credit-transaction.dto';
import { TransactionType, TransactionStatus } from './entities/credit-transaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get vendor credit balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Request() req) {
    const balance = await this.creditsService.getVendorBalance(req.user.id);
    return {
      success: true,
      data: balance,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get vendor credit transactions' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @Request() req,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.creditsService.getVendorTransactions(req.user.id, {
      type,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        page: page || 0,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase credits' })
  @ApiResponse({ status: 201, description: 'Credits purchased successfully' })
  @ApiResponse({ status: 400, description: 'Invalid purchase data' })
  async purchaseCredits(@Request() req, @Body() purchaseDto: PurchaseCreditsDto) {
    const transaction = await this.creditsService.purchaseCredits(req.user.id, purchaseDto);
    return {
      success: true,
      data: transaction,
      message: 'Credits purchased successfully',
    };
  }

  @Post('use')
  @ApiOperation({ summary: 'Use credits' })
  @ApiResponse({ status: 201, description: 'Credits used successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient credits or invalid data' })
  async useCredits(@Request() req, @Body() useDto: UseCreditsDto) {
    const transaction = await this.creditsService.useCredits(req.user.id, useDto);
    return {
      success: true,
      data: transaction,
      message: 'Credits used successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get credit statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req) {
    const stats = await this.creditsService.getCreditStats(req.user.id);
    return {
      success: true,
      data: stats,
    };
  }

  // Admin endpoints
  @Post('admin/bonus/:vendorId')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add bonus credits to vendor (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bonus credits added successfully' })
  async addBonusCredits(
    @Request() req,
    @Param('vendorId') vendorId: string,
    @Body() body: { amount: number; description: string }
  ) {
    const transaction = await this.creditsService.addBonusCredits(
      vendorId,
      body.amount,
      body.description,
      req.user.id
    );
    return {
      success: true,
      data: transaction,
      message: 'Bonus credits added successfully',
    };
  }

  @Post('admin/refund/:transactionId')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Refund credits (Admin only)' })
  @ApiResponse({ status: 201, description: 'Credits refunded successfully' })
  async refundCredits(
    @Request() req,
    @Param('transactionId') transactionId: string,
    @Body() body: { amount: number; reason: string }
  ) {
    const transaction = await this.creditsService.refundCredits(
      transactionId,
      body.amount,
      body.reason,
      req.user.id
    );
    return {
      success: true,
      data: transaction,
      message: 'Credits refunded successfully',
    };
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get system-wide credit statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getAdminStats() {
    const stats = await this.creditsService.getCreditStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('admin/vendor/:vendorId/balance')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get vendor balance (Admin only)' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getVendorBalance(@Param('vendorId') vendorId: string) {
    const balance = await this.creditsService.getVendorBalance(vendorId);
    return {
      success: true,
      data: balance,
    };
  }

  @Get('admin/vendor/:vendorId/transactions')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get vendor transactions (Admin only)' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVendorTransactions(
    @Param('vendorId') vendorId: string,
    @Query('type') type?: TransactionType,
    @Query('status') status?: TransactionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.creditsService.getVendorTransactions(vendorId, {
      type,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        page: page || 0,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }
}
