import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Vendor, VendorCategory } from './entities/vendor.entity';
import { VendorService } from './entities/vendor-service.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorService)
    private readonly vendorServiceRepository: Repository<VendorService>,
  ) {}

  async getAllVendors(filters: {
    category?: VendorCategory;
    location?: string;
    isApproved?: boolean;
    isVisible?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = this.vendorRepository.createQueryBuilder('vendor')
      .leftJoinAndSelect('vendor.vendorServices', 'services', 'services.isActive = :active', { active: true })
      .orderBy('vendor.createdAt', 'DESC');

    // Apply filters
    if (filters.category) {
      query.andWhere('vendor.category = :category', { category: filters.category });
    }

    if (filters.location) {
      query.andWhere('LOWER(vendor.location) LIKE :location', {
        location: `%${filters.location.toLowerCase()}%`
      });
    }

    if (filters.isApproved !== undefined) {
      query.andWhere('vendor.isApproved = :isApproved', { isApproved: filters.isApproved });
    }

    if (filters.isVisible !== undefined) {
      query.andWhere('vendor.isVisible = :isVisible', { isVisible: filters.isVisible });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [vendors, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVendorById(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['vendorServices'],
    });
    
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    
    return vendor;
  }

  async getVendorByUserId(userId: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { userId },
      relations: ['vendorServices'],
    });
    
    if (!vendor) {
      throw new NotFoundException(`Vendor with user ID ${userId} not found`);
    }
    
    return vendor;
  }

  async createVendor(userId: string, createVendorDto: CreateVendorDto): Promise<Vendor> {
    // Check if vendor already exists for this user
    const existingVendor = await this.vendorRepository.findOne({
      where: { userId },
    });

    if (existingVendor) {
      throw new ConflictException('Vendor profile already exists for this user');
    }

    const vendor = this.vendorRepository.create({
      userId,
      isApproved: false,
      isVisible: false,
      isFeatured: false,
      rating: 0,
      totalReviews: 0,
      portfolio: [],
      creditBalance: 0,
      businessName: createVendorDto.businessName,
      businessDescription: createVendorDto.businessDescription,
      category: createVendorDto.category as any,
      location: createVendorDto.location,
      contactInfo: createVendorDto.contactInfo,
      businessInfo: createVendorDto.businessInfo,
    });

    return this.vendorRepository.save(vendor);
  }

  async updateVendor(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.getVendorById(id);
    
    Object.assign(vendor, updateVendorDto);
    
    return this.vendorRepository.save(vendor);
  }

  async deleteVendor(id: string): Promise<void> {
    const vendor = await this.getVendorById(id);
    await this.vendorRepository.remove(vendor);
  }

  async getVendorPortfolio(id: string) {
    const vendor = await this.getVendorById(id);
    return vendor.portfolio;
  }

  async updateVendorPortfolio(id: string, portfolio: any[]): Promise<Vendor> {
    const vendor = await this.getVendorById(id);
    vendor.portfolio = portfolio;
    return this.vendorRepository.save(vendor);
  }

  async getVendorServices(vendorId: string): Promise<VendorService[]> {
    return this.vendorServiceRepository.find({
      where: { vendorId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createVendorService(vendorId: string, serviceData: Partial<VendorService>): Promise<VendorService> {
    const service = this.vendorServiceRepository.create({
      ...serviceData,
      vendorId,
    });
    return this.vendorServiceRepository.save(service);
  }

  async updateVendorService(serviceId: string, serviceData: Partial<VendorService>): Promise<VendorService> {
    const service = await this.vendorServiceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Vendor service not found');
    }

    Object.assign(service, serviceData);
    return this.vendorServiceRepository.save(service);
  }

  async deleteVendorService(serviceId: string): Promise<void> {
    const service = await this.vendorServiceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Vendor service not found');
    }

    await this.vendorServiceRepository.remove(service);
  }

  async approveVendor(id: string): Promise<Vendor> {
    const vendor = await this.getVendorById(id);
    vendor.isApproved = true;
    vendor.isVisible = true;
    return this.vendorRepository.save(vendor);
  }

  async rejectVendor(id: string): Promise<Vendor> {
    const vendor = await this.getVendorById(id);
    vendor.isApproved = false;
    vendor.isVisible = false;
    return this.vendorRepository.save(vendor);
  }

  async updateVendorRating(id: string, newRating: number): Promise<Vendor> {
    const vendor = await this.getVendorById(id);
    
    // Calculate new average rating
    const totalRating = vendor.rating * vendor.totalReviews + newRating;
    vendor.totalReviews += 1;
    vendor.rating = totalRating / vendor.totalReviews;
    
    return this.vendorRepository.save(vendor);
  }

  async searchVendors(searchTerm: string, filters?: {
    category?: VendorCategory;
    location?: string;
    minRating?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const query = this.vendorRepository.createQueryBuilder('vendor')
      .where('vendor.isApproved = :approved AND vendor.isVisible = :visible', { 
        approved: true, 
        visible: true 
      })
      .andWhere('vendor.creditBalance > 0')
      .leftJoinAndSelect('vendor.vendorServices', 'services', 'services.isActive = :active', { active: true });

    if (searchTerm) {
      query.andWhere(
        '(LOWER(vendor.business_name) LIKE :search OR LOWER(vendor.business_description) LIKE :search)',
        { search: `%${searchTerm.toLowerCase()}%` }
      );
    }

    if (filters?.category) {
      query.andWhere('vendor.category = :category', { category: filters.category });
    }

    if (filters?.location) {
      query.andWhere('LOWER(vendor.location) LIKE :location', {
        location: `%${filters.location.toLowerCase()}%`
      });
    }

    if (filters?.minRating) {
      query.andWhere('vendor.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters?.maxPrice) {
      query.andWhere("CAST(JSON_UNQUOTE(JSON_EXTRACT(vendor.price_range, '$.max')) AS DECIMAL(10,2)) <= :maxPrice", {
        maxPrice: filters.maxPrice
      });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [vendors, total] = await query
      .orderBy('vendor.rating', 'DESC')
      .addOrderBy('vendor.totalReviews', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVendorStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    byCategory: Record<string, number>;
  }> {
    const [total, approved, pending] = await Promise.all([
      this.vendorRepository.count(),
      this.vendorRepository.count({ where: { isApproved: true } }),
      this.vendorRepository.count({ where: { isApproved: false } }),
    ]);

    // Get category breakdown
    const categoryStats = await this.vendorRepository
      .createQueryBuilder('vendor')
      .select('vendor.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vendor.category')
      .getRawMany();

    const byCategory = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      approved,
      pending,
      byCategory,
    };
  }
}
