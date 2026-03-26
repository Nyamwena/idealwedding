import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteResponse, ResponseStatus } from './entities/quote-response.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteResponseDto, UpdateQuoteResponseDto } from './dto/quote-response.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteResponse)
    private readonly quoteResponseRepository: Repository<QuoteResponse>,
    private readonly notificationService: NotificationService,
  ) {}

  async createQuote(userId: string, createQuoteDto: CreateQuoteDto): Promise<Quote> {
    const requestedVendorIds = createQuoteDto.vendorIds || [];
    let eligibleVendorIds: string[] = [];

    if (requestedVendorIds.length > 0) {
      const placeholders = requestedVendorIds.map(() => '?').join(', ');
      const eligibleVendors = await this.quoteRepository.query(
        `SELECT id FROM vendors 
         WHERE id IN (${placeholders})
           AND is_approved = 1
           AND is_visible = 1
           AND credit_balance > 0`,
        requestedVendorIds,
      );
      eligibleVendorIds = eligibleVendors.map((vendor: { id: string }) => vendor.id);
    }

    if (requestedVendorIds.length > 0 && eligibleVendorIds.length === 0) {
      throw new BadRequestException('No eligible vendors found with available credits');
    }

    const quote = this.quoteRepository.create({
      ...createQuoteDto,
      userId,
      vendorId: eligibleVendorIds[0],
      status: QuoteStatus.PENDING,
    });

    const savedQuote = await this.quoteRepository.save(quote);
    
    // Send notifications to vendors
    if (eligibleVendorIds.length > 0) {
      const placeholders = eligibleVendorIds.map(() => '?').join(', ');
      const vendorRows = await this.quoteRepository.query(
        `SELECT id, business_name, contact_info FROM vendors WHERE id IN (${placeholders})`,
        eligibleVendorIds,
      );

      // Decrement one credit per vendor included in this quote request.
      await this.quoteRepository.query(
        `UPDATE vendors 
         SET credit_balance = credit_balance - 1 
         WHERE id IN (${placeholders})`,
        eligibleVendorIds,
      );
      await this.notificationService.notifyQuoteCreated(savedQuote.id, userId, eligibleVendorIds);
      await this.notificationService.sendQuoteRequestEmails(
        vendorRows.map((vendor: { id: string; business_name: string; contact_info?: string }) => {
          let email: string | undefined;
          try {
            const contact = vendor.contact_info ? JSON.parse(vendor.contact_info) : undefined;
            email = contact?.email;
          } catch {
            email = undefined;
          }
          return {
            id: vendor.id,
            businessName: vendor.business_name,
            email,
          };
        }),
        {
          quoteId: savedQuote.id,
          coupleId: userId,
          serviceCategory: savedQuote.serviceCategory,
          location: savedQuote.eventLocation?.city,
          budgetMin: savedQuote.budgetMin,
          budgetMax: savedQuote.budgetMax,
        },
      );
    }
    
    return savedQuote;
  }

  async getQuotesByUser(userId: string, filters?: {
    status?: QuoteStatus;
    serviceCategory?: string;
    page?: number;
    limit?: number;
  }): Promise<{ quotes: Quote[]; total: number }> {
    const query = this.quoteRepository.createQueryBuilder('quote')
      .where('quote.user_id = :userId', { userId })
      .orderBy('quote.created_at', 'DESC');

    if (filters?.status) {
      query.andWhere('quote.status = :status', { status: filters.status });
    }

    if (filters?.serviceCategory) {
      query.andWhere('quote.service_category = :serviceCategory', {
        serviceCategory: filters.serviceCategory 
      });
    }

    const [quotes, total] = await query
      .skip((filters?.page || 0) * (filters?.limit || 10))
      .take(filters?.limit || 10)
      .getManyAndCount();

    return { quotes, total };
  }

  async getQuotesByVendor(vendorId: string, filters?: {
    status?: QuoteStatus;
    serviceCategory?: string;
    page?: number;
    limit?: number;
  }): Promise<{ quotes: Quote[]; total: number }> {
    const query = this.quoteRepository.createQueryBuilder('quote')
      .where('quote.vendor_id = :vendorId', { vendorId })
      .orderBy('quote.created_at', 'DESC');

    if (filters?.status) {
      query.andWhere('quote.status = :status', { status: filters.status });
    }

    if (filters?.serviceCategory) {
      query.andWhere('quote.service_category = :serviceCategory', {
        serviceCategory: filters.serviceCategory 
      });
    }

    const [quotes, total] = await query
      .skip((filters?.page || 0) * (filters?.limit || 10))
      .take(filters?.limit || 10)
      .getManyAndCount();

    return { quotes, total };
  }

  async getQuoteById(id: string, userId?: string, vendorId?: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    // Check permissions
    if (userId && quote.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (vendorId && quote.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied');
    }

    return quote;
  }

  async respondToQuote(
    quoteId: string, 
    vendorId: string, 
    createResponseDto: CreateQuoteResponseDto
  ): Promise<QuoteResponse> {
    const quote = await this.getQuoteById(quoteId, undefined, vendorId);

    if (quote.status !== QuoteStatus.PENDING && quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException('Quote is no longer accepting responses');
    }

    // Create response
    const response = this.quoteResponseRepository.create({
      ...createResponseDto,
      quoteId,
      vendorId,
      status: ResponseStatus.PENDING,
    });

    const savedResponse = await this.quoteResponseRepository.save(response);

    // Update quote status and response count
    await this.quoteRepository.update(quoteId, {
      status: QuoteStatus.RESPONDED,
      responseDate: new Date(),
      totalResponses: quote.totalResponses + 1,
      vendorResponse: {
        message: createResponseDto.message,
        price: createResponseDto.price,
        currency: createResponseDto.currency || 'USD',
        validUntil: createResponseDto.validUntil ? new Date(createResponseDto.validUntil) : undefined,
        terms: createResponseDto.terms,
        attachments: createResponseDto.attachments,
      },
    });

    // Send notification to user about vendor response
    await this.notificationService.notifyQuoteResponse(quoteId, quote.userId, vendorId, savedResponse.id);

    return savedResponse;
  }

  async getQuoteResponses(quoteId: string, userId: string): Promise<QuoteResponse[]> {
    const quote = await this.getQuoteById(quoteId, userId);
    
    return this.quoteResponseRepository.find({
      where: { quoteId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateQuoteResponse(
    responseId: string,
    vendorId: string,
    updateDto: UpdateQuoteResponseDto
  ): Promise<QuoteResponse> {
    const response = await this.quoteResponseRepository.findOne({
      where: { id: responseId, vendorId },
    });

    if (!response) {
      throw new NotFoundException('Quote response not found');
    }

    if (response.status !== ResponseStatus.PENDING) {
      throw new BadRequestException('Cannot update non-pending response');
    }

    Object.assign(response, updateDto);
    return this.quoteResponseRepository.save(response);
  }

  async acceptQuoteResponse(responseId: string, userId: string): Promise<QuoteResponse> {
    const response = await this.quoteResponseRepository.findOne({
      where: { id: responseId },
      relations: ['quote'],
    });

    if (!response) {
      throw new NotFoundException('Quote response not found');
    }

    if (response.quote.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (response.status !== ResponseStatus.PENDING) {
      throw new BadRequestException('Response is no longer available');
    }

    // Update response status
    response.status = ResponseStatus.ACCEPTED;
    await this.quoteResponseRepository.save(response);

    // Update quote status
    await this.quoteRepository.update(response.quoteId, {
      status: QuoteStatus.ACCEPTED,
    });

    // Send notification to vendor about acceptance
    await this.notificationService.notifyQuoteAccepted(response.quoteId, response.vendorId, userId);
    
    // TODO: Create booking/contract

    return response;
  }

  async rejectQuoteResponse(responseId: string, userId: string): Promise<QuoteResponse> {
    const response = await this.quoteResponseRepository.findOne({
      where: { id: responseId },
      relations: ['quote'],
    });

    if (!response) {
      throw new NotFoundException('Quote response not found');
    }

    if (response.quote.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    response.status = ResponseStatus.REJECTED;
    const savedResponse = await this.quoteResponseRepository.save(response);
    
    // Send notification to vendor about rejection
    await this.notificationService.notifyQuoteRejected(response.quoteId, response.vendorId, userId);
    
    return savedResponse;
  }

  async getQuoteStats(userId?: string, vendorId?: string): Promise<{
    total: number;
    pending: number;
    responded: number;
    accepted: number;
    rejected: number;
  }> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (vendorId) where.vendorId = vendorId;

    const [total, pending, responded, accepted, rejected] = await Promise.all([
      this.quoteRepository.count({ where }),
      this.quoteRepository.count({ where: { ...where, status: QuoteStatus.PENDING } }),
      this.quoteRepository.count({ where: { ...where, status: QuoteStatus.RESPONDED } }),
      this.quoteRepository.count({ where: { ...where, status: QuoteStatus.ACCEPTED } }),
      this.quoteRepository.count({ where: { ...where, status: QuoteStatus.REJECTED } }),
    ]);

    return { total, pending, responded, accepted, rejected };
  }

  async searchQuotes(filters: {
    serviceCategory?: string;
    location?: string;
    budgetMin?: number;
    budgetMax?: number;
    eventDateFrom?: Date;
    eventDateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ quotes: Quote[]; total: number }> {
    const query = this.quoteRepository.createQueryBuilder('quote')
      .where('quote.status IN (:...statuses)', { 
        statuses: [QuoteStatus.PENDING, QuoteStatus.SENT] 
      })
      .orderBy('quote.created_at', 'DESC');

    if (filters.serviceCategory) {
      query.andWhere('quote.service_category = :serviceCategory', {
        serviceCategory: filters.serviceCategory 
      });
    }

    if (filters.location) {
      query.andWhere('LOWER(quote.event_location) LIKE :location', {
        location: `%${filters.location.toLowerCase()}%`
      });
    }

    if (filters.budgetMin || filters.budgetMax) {
      if (filters.budgetMin && filters.budgetMax) {
        query.andWhere('quote.budget_min >= :budgetMin AND quote.budget_max <= :budgetMax', {
          budgetMin: filters.budgetMin,
          budgetMax: filters.budgetMax,
        });
      } else if (filters.budgetMin) {
        query.andWhere('quote.budget_min >= :budgetMin', { budgetMin: filters.budgetMin });
      } else if (filters.budgetMax) {
        query.andWhere('quote.budget_max <= :budgetMax', { budgetMax: filters.budgetMax });
      }
    }

    if (filters.eventDateFrom || filters.eventDateTo) {
      if (filters.eventDateFrom && filters.eventDateTo) {
        query.andWhere('quote.event_date BETWEEN :dateFrom AND :dateTo', {
          dateFrom: filters.eventDateFrom,
          dateTo: filters.eventDateTo,
        });
      } else if (filters.eventDateFrom) {
        query.andWhere('quote.event_date >= :dateFrom', { dateFrom: filters.eventDateFrom });
      } else if (filters.eventDateTo) {
        query.andWhere('quote.event_date <= :dateTo', { dateTo: filters.eventDateTo });
      }
    }

    const [quotes, total] = await query
      .skip((filters.page || 0) * (filters.limit || 10))
      .take(filters.limit || 10)
      .getManyAndCount();

    return { quotes, total };
  }
}
