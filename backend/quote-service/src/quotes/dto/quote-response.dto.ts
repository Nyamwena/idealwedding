import { IsString, IsNumber, IsOptional, IsDateString, IsBoolean, IsArray, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseStatus } from '../entities/quote-response.entity';

export class CreateQuoteResponseDto {
  @ApiProperty({ description: 'Response message from vendor' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Quoted price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Quote validity date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Attachments URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Whether this response is featured' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Response time in hours' })
  @IsOptional()
  @IsNumber()
  responseTimeHours?: number;
}

export class UpdateQuoteResponseDto {
  @ApiPropertyOptional({ description: 'Response message from vendor' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Quoted price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Quote validity date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Attachments URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Response status' })
  @IsOptional()
  @IsEnum(ResponseStatus)
  status?: ResponseStatus;

  @ApiPropertyOptional({ description: 'Whether this response is featured' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Response time in hours' })
  @IsOptional()
  @IsNumber()
  responseTimeHours?: number;
}
