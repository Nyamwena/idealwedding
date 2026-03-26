import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RsvpStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity('guests')
@Index(['userId'])
@Index(['userId', 'rsvpStatus'])
export class Guest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({
    name: 'rsvp_status',
    type: 'enum',
    enum: RsvpStatus,
    default: RsvpStatus.PENDING,
  })
  rsvpStatus: RsvpStatus;

  @Column({ name: 'dietary_requirements', type: 'simple-json', nullable: true })
  dietaryRequirements?: string[];

  @Column({ name: 'plus_one', type: 'boolean', default: false })
  plusOne: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
