import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('vendor_services')
@Index(['vendorId', 'isActive'])
@Index(['category', 'isActive'])
export class VendorService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ name: 'service_name', type: 'varchar', length: 255 })
  serviceName: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'category', type: 'varchar', length: 100 })
  category: string;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'pricing_type', type: 'varchar', length: 50, default: 'fixed' })
  pricingType: 'fixed' | 'hourly' | 'per_person' | 'custom';

  @Column({ name: 'duration_hours', type: 'int', nullable: true })
  durationHours?: number;

  @Column({ name: 'min_guests', type: 'int', nullable: true })
  minGuests?: number;

  @Column({ name: 'max_guests', type: 'int', nullable: true })
  maxGuests?: number;

  @Column({ name: 'includes', type: 'simple-json', default: '[]' })
  includes: string[];

  @Column({ name: 'add_ons', type: 'simple-json', default: '[]' })
  addOns: {
    name: string;
    price: number;
    description?: string;
  }[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Vendor, (vendor) => vendor.vendorServices)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;
}
