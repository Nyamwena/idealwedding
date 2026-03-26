import { IsString, IsOptional, IsNumber, IsDateString, IsObject, IsBoolean, IsArray, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from '../entities/quote.entity';

export class CreateQuoteDto {
  @ApiProperty({ description: 'Service category for the quote' })
  @IsString()
  serviceCategory: string;

  @ApiProperty({ description: 'Detailed requirements for the quote' })
  @IsObject()
  requirements: Record<string, any>;

  @ApiPropertyOptional({ description: 'Minimum budget for the quote' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ description: 'Maximum budget for the quote' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ description: 'Event date' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'Event location details' })
  @IsOptional()
  @IsObject()
  eventLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
  };

  @ApiPropertyOptional({ description: 'Wedding ID if associated with a wedding' })
  @IsOptional()
  @IsString()
  weddingId?: string;

  @ApiPropertyOptional({ description: 'Whether this quote is urgent' })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Array of vendor IDs to send quote to' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vendorIds?: string[];
}
