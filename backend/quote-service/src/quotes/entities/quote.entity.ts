import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum QuoteStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RESPONDED = 'responded',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('quotes')
@Index(['userId', 'status'])
@Index(['vendorId', 'status'])
@Index(['createdAt'])
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'vendor_id', type: 'uuid', nullable: true })
  vendorId?: string;

  @Column({ name: 'wedding_id', type: 'uuid', nullable: true })
  weddingId?: string;

  @Column({ name: 'service_category', type: 'varchar', length: 100 })
  serviceCategory: string;

  @Column({ name: 'requirements', type: 'simple-json' })
  requirements: Record<string, any>;

  @Column({ name: 'budget_min', type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMin?: number;

  @Column({ name: 'budget_max', type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMax?: number;

  @Column({ name: 'event_date', type: 'timestamp', nullable: true })
  eventDate?: Date;

  @Column({ name: 'event_location', type: 'simple-json', nullable: true })
  eventLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
  };

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: QuoteStatus, 
    default: QuoteStatus.PENDING 
  })
  status: QuoteStatus;

  @Column({ name: 'vendor_response', type: 'simple-json', nullable: true })
  vendorResponse?: {
    message: string;
    price: number;
    currency: string;
    validUntil?: Date;
    terms?: string;
    attachments?: string[];
  };

  @Column({ name: 'response_date', type: 'timestamp', nullable: true })
  responseDate?: Date;

  @Column({ name: 'total_responses', type: 'int', default: 0 })
  totalResponses: number;

  @Column({ name: 'is_urgent', type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual relationships (will be populated via joins)
  user?: any;
  vendor?: any;
  wedding?: any;
}
