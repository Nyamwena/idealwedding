import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Quote } from './quote.entity';

export enum ResponseStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

@Entity('quote_responses')
@Index(['quoteId', 'vendorId'])
@Index(['status', 'createdAt'])
export class QuoteResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quote_id', type: 'uuid' })
  quoteId: string;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'valid_until', type: 'timestamp', nullable: true })
  validUntil?: Date;

  @Column({ name: 'terms', type: 'text', nullable: true })
  terms?: string;

  @Column({ name: 'attachments', type: 'simple-json', nullable: true })
  attachments?: string[];

  @Column({ 
    name: 'status', 
    type: 'enum', 
    enum: ResponseStatus, 
    default: ResponseStatus.PENDING 
  })
  status: ResponseStatus;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'response_time_hours', type: 'int', nullable: true })
  responseTimeHours?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Quote, quote => quote.id)
  @JoinColumn({ name: 'quote_id' })
  quote: Quote;
}
