import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('vendor_credit_balances')
@Index(['vendorId'], { unique: true })
export class VendorCreditBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id', type: 'uuid', unique: true })
  vendorId: string;

  @Column({ name: 'balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ name: 'total_purchased', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPurchased: number;

  @Column({ name: 'total_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalUsed: number;

  @Column({ name: 'total_refunded', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRefunded: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
