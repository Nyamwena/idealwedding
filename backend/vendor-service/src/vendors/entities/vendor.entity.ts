import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { VendorService } from './vendor-service.entity';

export enum VendorCategory {
  VENUE = 'venue',
  CATERING = 'catering',
  PHOTOGRAPHY = 'photography',
  MUSIC = 'music',
  DECOR = 'decor',
  TRANSPORTATION = 'transportation',
  PLANNING = 'planning',
  FLORIST = 'florist',
  OTHER = 'other'
}

@Entity('vendors')
@Index(['userId'], { unique: true })
@Index(['category', 'isApproved'])
@Index(['location'])
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @Column({ name: 'business_description', type: 'text', nullable: true })
  businessDescription?: string;

  @Column({ 
    name: 'category', 
    type: 'enum', 
    enum: VendorCategory 
  })
  category: VendorCategory;

  @Column({ name: 'location', type: 'simple-json' })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  @Column({ name: 'contact_info', type: 'simple-json' })
  contactInfo: {
    phone: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };

  @Column({ name: 'services', type: 'simple-json', default: '[]' })
  services: string[];

  @Column({ name: 'price_range', type: 'simple-json', nullable: true })
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };

  @Column({ name: 'is_approved', type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ name: 'is_visible', type: 'boolean', default: false })
  isVisible: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  totalReviews: number;

  @Column({ name: 'portfolio', type: 'simple-json', default: '[]' })
  portfolio: {
    id: string;
    type: 'image' | 'video';
    url: string;
    title: string;
    description?: string;
  }[];

  @Column({ name: 'business_info', type: 'simple-json', nullable: true })
  businessInfo?: {
    yearsInBusiness?: number;
    teamSize?: number;
    languages?: string[];
    certifications?: string[];
    insurance?: boolean;
    licenseNumber?: string;
  };

  @Column({ name: 'availability', type: 'simple-json', nullable: true })
  availability?: {
    workingHours?: {
      monday?: { start: string; end: string; available: boolean };
      tuesday?: { start: string; end: string; available: boolean };
      wednesday?: { start: string; end: string; available: boolean };
      thursday?: { start: string; end: string; available: boolean };
      friday?: { start: string; end: string; available: boolean };
      saturday?: { start: string; end: string; available: boolean };
      sunday?: { start: string; end: string; available: boolean };
    };
    timezone?: string;
    advanceBookingDays?: number;
  };

  @Column({ name: 'credit_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditBalance: number;

  @OneToMany(() => VendorService, (service) => service.vendor)
  vendorServices: VendorService[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
