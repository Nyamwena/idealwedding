import { IsString, IsNumber, IsOptional, IsEnum, Min, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../entities/credit-transaction.entity';

export class CreateCreditTransactionDto {
  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PurchaseCreditsDto {
  @ApiProperty({ description: 'Number of credits to purchase' })
  @IsNumber()
  @Min(1)
  credits: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment method ID' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

export class UseCreditsDto {
  @ApiProperty({ description: 'Number of credits to use' })
  @IsNumber()
  @Min(1)
  credits: number;

  @ApiProperty({ description: 'Description of credit usage' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
