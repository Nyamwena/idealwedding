import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsBoolean, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceRangeDto {
  @ApiProperty({ description: 'Minimum price', example: 1000 })
  @IsNumber()
  @Min(0)
  min: number;

  @ApiProperty({ description: 'Maximum price', example: 5000 })
  @IsNumber()
  @Min(0)
  max: number;
}

export class ContactInfoDto {
  @ApiProperty({ description: 'Phone number', example: '+1 (555) 123-4567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://example.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export class BusinessInfoDto {
  @ApiPropertyOptional({ description: 'Years in business', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsInBusiness?: number;

  @ApiPropertyOptional({ description: 'Team size', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  teamSize?: number;

  @ApiPropertyOptional({ description: 'Languages spoken', example: ['English', 'Spanish'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Certifications', example: ['Professional Certification'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Has insurance', example: true })
  @IsOptional()
  @IsBoolean()
  insurance?: boolean;
}

export class LocationDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class CreateVendorDto {
  @ApiProperty({ description: 'Business name', example: 'Elite Wedding Photography' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ description: 'Business description', example: 'Professional wedding photography services' })
  @IsOptional()
  @IsString()
  businessDescription?: string;

  @ApiProperty({ description: 'Service category', example: 'photography' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Location information', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: 'Contact information', type: ContactInfoDto })
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @ApiPropertyOptional({ description: 'Services offered', example: ['Wedding Photography', 'Engagement Photos'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ description: 'Price range', type: PriceRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;

  @ApiPropertyOptional({ description: 'Business information', type: BusinessInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  businessInfo?: BusinessInfoDto;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ description: 'Business name', example: 'Elite Wedding Photography' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'contact@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Service category', example: 'Photography' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'New York, NY' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Business description', example: 'Professional wedding photography services' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Price range', type: PriceRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;

  @ApiPropertyOptional({ description: 'Contact information', type: ContactInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @ApiPropertyOptional({ description: 'Business information', type: BusinessInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  businessInfo?: BusinessInfoDto;

  @ApiPropertyOptional({ description: 'Is approved', example: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'Is visible', example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Is featured', example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class VendorResponseDto {
  @ApiProperty({ description: 'Vendor ID', example: 'vendor_001' })
  id: string;

  @ApiProperty({ description: 'Business name', example: 'Elite Wedding Photography' })
  businessName: string;

  @ApiProperty({ description: 'Email address', example: 'contact@example.com' })
  email: string;

  @ApiProperty({ description: 'Service category', example: 'Photography' })
  category: string;

  @ApiProperty({ description: 'Location', example: 'New York, NY' })
  location: string;

  @ApiProperty({ description: 'Business description', example: 'Professional wedding photography services' })
  description: string;

  @ApiProperty({ description: 'Is approved', example: true })
  isApproved: boolean;

  @ApiProperty({ description: 'Is visible', example: true })
  isVisible: boolean;

  @ApiProperty({ description: 'Is featured', example: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'Average rating', example: 4.8 })
  rating: number;

  @ApiProperty({ description: 'Number of reviews', example: 127 })
  reviewCount: number;

  @ApiProperty({ description: 'Price range', type: PriceRangeDto })
  priceRange: PriceRangeDto;

  @ApiProperty({ description: 'Portfolio items' })
  portfolio: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
  }>;

  @ApiProperty({ description: 'Contact information', type: ContactInfoDto })
  contactInfo: ContactInfoDto;

  @ApiProperty({ description: 'Business information', type: BusinessInfoDto })
  businessInfo: BusinessInfoDto;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T00:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-09-24T10:30:00Z' })
  updatedAt: string;
}
