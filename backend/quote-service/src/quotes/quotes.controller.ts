import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteResponseDto, UpdateQuoteResponseDto } from './dto/quote-response.dto';
import { QuoteStatus } from './entities/quote.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';

@ApiTags('quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote request' })
  @ApiResponse({ status: 201, description: 'Quote created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createQuote(@Request() req, @Body() createQuoteDto: CreateQuoteDto) {
    const quote = await this.quotesService.createQuote(req.user.id, createQuoteDto);
    return {
      success: true,
      data: quote,
      message: 'Quote created successfully',
    };
  }

  @Get('my-quotes')
  @ApiOperation({ summary: 'Get quotes created by the current user' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'serviceCategory', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyQuotes(
    @Request() req,
    @Query('status') status?: QuoteStatus,
    @Query('serviceCategory') serviceCategory?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.quotesService.getQuotesByUser(req.user.id, {
      status,
      serviceCategory,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data: result.quotes,
      pagination: {
        total: result.total,
        page: page || 0,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Get('vendor-quotes')
  @Roles(UserRole.VENDOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get quotes for the current vendor' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'serviceCategory', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVendorQuotes(
    @Request() req,
    @Query('status') status?: QuoteStatus,
    @Query('serviceCategory') serviceCategory?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.quotesService.getQuotesByVendor(req.user.id, {
      status,
      serviceCategory,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data: result.quotes,
      pagination: {
        total: result.total,
        page: page || 0,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search quotes (for vendors)' })
  @ApiQuery({ name: 'serviceCategory', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'budgetMin', required: false, type: Number })
  @ApiQuery({ name: 'budgetMax', required: false, type: Number })
  @ApiQuery({ name: 'eventDateFrom', required: false })
  @ApiQuery({ name: 'eventDateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchQuotes(
    @Query('serviceCategory') serviceCategory?: string,
    @Query('location') location?: string,
    @Query('budgetMin') budgetMin?: number,
    @Query('budgetMax') budgetMax?: number,
    @Query('eventDateFrom') eventDateFrom?: string,
    @Query('eventDateTo') eventDateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.quotesService.searchQuotes({
      serviceCategory,
      location,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      eventDateFrom: eventDateFrom ? new Date(eventDateFrom) : undefined,
      eventDateTo: eventDateTo ? new Date(eventDateTo) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data: result.quotes,
      pagination: {
        total: result.total,
        page: page || 0,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async getQuote(@Request() req, @Param('id') id: string) {
    const quote = await this.quotesService.getQuoteById(id, req.user.id);
    return {
      success: true,
      data: quote,
    };
  }

  @Post(':id/respond')
  @Roles(UserRole.VENDOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Respond to a quote' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid response data' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async respondToQuote(
    @Request() req,
    @Param('id') id: string,
    @Body() createResponseDto: CreateQuoteResponseDto,
  ) {
    const response = await this.quotesService.respondToQuote(id, req.user.id, createResponseDto);
    return {
      success: true,
      data: response,
      message: 'Response submitted successfully',
    };
  }

  @Get(':id/responses')
  @ApiOperation({ summary: 'Get responses for a quote' })
  @ApiResponse({ status: 200, description: 'Responses retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async getQuoteResponses(@Request() req, @Param('id') id: string) {
    const responses = await this.quotesService.getQuoteResponses(id, req.user.id);
    return {
      success: true,
      data: responses,
    };
  }

  @Patch('responses/:responseId')
  @Roles(UserRole.VENDOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a quote response' })
  @ApiResponse({ status: 200, description: 'Response updated successfully' })
  @ApiResponse({ status: 404, description: 'Response not found' })
  async updateQuoteResponse(
    @Request() req,
    @Param('responseId') responseId: string,
    @Body() updateDto: UpdateQuoteResponseDto,
  ) {
    const response = await this.quotesService.updateQuoteResponse(
      responseId,
      req.user.id,
      updateDto,
    );
    return {
      success: true,
      data: response,
      message: 'Response updated successfully',
    };
  }

  @Post('responses/:responseId/accept')
  @ApiOperation({ summary: 'Accept a quote response' })
  @ApiResponse({ status: 200, description: 'Response accepted successfully' })
  @ApiResponse({ status: 404, description: 'Response not found' })
  async acceptQuoteResponse(@Request() req, @Param('responseId') responseId: string) {
    const response = await this.quotesService.acceptQuoteResponse(responseId, req.user.id);
    return {
      success: true,
      data: response,
      message: 'Response accepted successfully',
    };
  }

  @Post('responses/:responseId/reject')
  @ApiOperation({ summary: 'Reject a quote response' })
  @ApiResponse({ status: 200, description: 'Response rejected successfully' })
  @ApiResponse({ status: 404, description: 'Response not found' })
  async rejectQuoteResponse(@Request() req, @Param('responseId') responseId: string) {
    const response = await this.quotesService.rejectQuoteResponse(responseId, req.user.id);
    return {
      success: true,
      data: response,
      message: 'Response rejected successfully',
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get quote statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getQuoteStats(@Request() req) {
    const stats = await this.quotesService.getQuoteStats(req.user.id);
    return {
      success: true,
      data: stats,
    };
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all quotes (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllQuotes(
    @Query('status') status?: QuoteStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // For admin, we can get all quotes without user restriction
    const result = await this.quotesService.getQuotesByUser('', {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      data: result.quotes,
      pagination: {
        total: result.total,
        page: page || 0,
        limit: limit || 10,
        totalPages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }
}
