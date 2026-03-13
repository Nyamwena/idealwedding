import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto, VendorResponseDto } from './dto/vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';

@ApiTags('vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'List of vendors', type: [VendorResponseDto] })
  async getAllVendors(
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('isApproved') isApproved?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.vendorsService.getAllVendors({ 
      category: category as any, 
      location, 
      isApproved, 
      page, 
      limit 
    });
  }

  @Get(':id([0-9a-fA-F-]{36})')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({ status: 200, description: 'Vendor details', type: VendorResponseDto })
  async getVendorById(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Post()
  @Roles(UserRole.VENDOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully', type: VendorResponseDto })
  async createVendor(@Request() req, @Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.createVendor(req.user.id, createVendorDto);
  }

  @Put(':id([0-9a-fA-F-]{36})')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully', type: VendorResponseDto })
  async updateVendor(@Param('id') id: string, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorsService.updateVendor(id, updateVendorDto);
  }

  @Delete(':id([0-9a-fA-F-]{36})')
  @ApiOperation({ summary: 'Delete vendor' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  async deleteVendor(@Param('id') id: string) {
    return this.vendorsService.deleteVendor(id);
  }

  @Get(':id([0-9a-fA-F-]{36})/portfolio')
  @ApiOperation({ summary: 'Get vendor portfolio' })
  @ApiResponse({ status: 200, description: 'Vendor portfolio items' })
  async getVendorPortfolio(@Param('id') id: string) {
    return this.vendorsService.getVendorPortfolio(id);
  }

  @Get(':id([0-9a-fA-F-]{36})/services')
  @ApiOperation({ summary: 'Get vendor services' })
  @ApiResponse({ status: 200, description: 'Vendor services' })
  async getVendorServices(@Param('id') id: string) {
    return this.vendorsService.getVendorServices(id);
  }

  @Post(':id([0-9a-fA-F-]{36})/approve')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Approve vendor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vendor approved successfully' })
  async approveVendor(@Param('id') id: string) {
    return this.vendorsService.approveVendor(id);
  }

  @Post(':id([0-9a-fA-F-]{36})/reject')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Reject vendor (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vendor rejected successfully' })
  async rejectVendor(@Param('id') id: string) {
    return this.vendorsService.rejectVendor(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search vendors' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchVendors(
    @Query('q') searchTerm: string,
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('minRating') minRating?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.vendorsService.searchVendors(searchTerm, {
      category: category as any,
      location,
      minRating,
      maxPrice,
      page,
      limit,
    });
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get vendor statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Vendor statistics' })
  async getVendorStats() {
    return this.vendorsService.getVendorStats();
  }
}
