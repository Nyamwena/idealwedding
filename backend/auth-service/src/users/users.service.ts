import { Injectable, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sgMail from '@sendgrid/mail';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserRole } from '../types';

@Injectable()
export class UsersService implements OnModuleInit {
  private isEmailEnabled = false;
  private fromEmail = 'noreply@idealweddings.local';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
  
  onModuleInit() {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY', '').trim();
    this.fromEmail = this.configService.get<string>('FROM_EMAIL', 'noreply@idealweddings.local');
    this.isEmailEnabled = apiKey.length > 0;
    if (this.isEmailEnabled) {
      sgMail.setApiKey(apiKey);
    }

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const emailRequired =
      this.configService.get<string>('EMAIL_REQUIRED', 'false').toLowerCase() === 'true';
    if (isProduction && emailRequired && !this.isEmailEnabled) {
      throw new Error(
        'EMAIL_REQUIRED is true but SENDGRID_API_KEY is missing. Set SENDGRID_API_KEY and FROM_EMAIL.',
      );
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      ...createUserDto,
      role: createUserDto.role || UserRole.USER,
    });

    // Set password
    await user.setPassword(createUserDto.password);

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Return user without sensitive data
    const { passwordHash, ...result } = savedUser;
    return result as User;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'passwordHash'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Update user fields
    Object.assign(user, updateUserDto);

    // Save updated user
    const updatedUser = await this.userRepository.save(user);

    // Return user without sensitive data
    const { passwordHash, ...result } = updatedUser;
    return result as User;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await user.setPassword(newPassword);
    await this.userRepository.save(user);
  }

  async verifyEmail(token: string): Promise<User> {
    throw new BadRequestException('Email verification is currently unavailable');
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }

    if (!this.isEmailEnabled) {
      console.warn(`[Email disabled] Password reset requested for ${email}`);
      return;
    }

    try {
      await sgMail.send({
        to: email,
        from: this.fromEmail,
        subject: 'Ideal Weddings password reset request',
        text: [
          `Hi ${user.firstName || 'there'},`,
          '',
          'A password reset was requested for your account.',
          'Password reset is currently in maintenance mode. Please contact support.',
        ].join('\n'),
      });
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
    }
    return;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    throw new BadRequestException('Password reset is currently unavailable');
  }

  async updateLastLogin(id: string): Promise<void> {
    return;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
    });
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.userRepository.count({ where: { role } });
  }

  async getStats(): Promise<{
    total: number;
    couples: number;
    vendors: number;
    admins: number;
    verified: number;
  }> {
    const [total, couples, vendors, admins] = await Promise.all([
      this.userRepository.count(),
      this.countByRole(UserRole.USER),
      this.countByRole(UserRole.VENDOR),
      this.countByRole(UserRole.ADMIN),
    ]);

    return {
      total,
      couples,
      vendors,
      admins,
      verified: 0,
    };
  }
} 