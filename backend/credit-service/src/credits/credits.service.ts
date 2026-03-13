import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreditTransaction, TransactionType, TransactionStatus } from './entities/credit-transaction.entity';
import { VendorCreditBalance } from './entities/vendor-credit-balance.entity';
import { CreateCreditTransactionDto, PurchaseCreditsDto, UseCreditsDto } from './dto/credit-transaction.dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditTransaction)
    private readonly creditTransactionRepository: Repository<CreditTransaction>,
    @InjectRepository(VendorCreditBalance)
    private readonly creditBalanceRepository: Repository<VendorCreditBalance>,
    private readonly dataSource: DataSource,
  ) {}

  async getVendorBalance(vendorId: string): Promise<VendorCreditBalance> {
    let balance = await this.creditBalanceRepository.findOne({
      where: { vendorId },
    });

    if (!balance) {
      // Create initial balance record
      balance = this.creditBalanceRepository.create({
        vendorId,
        balance: 0,
        currency: 'USD',
        totalPurchased: 0,
        totalUsed: 0,
        totalRefunded: 0,
      });
      balance = await this.creditBalanceRepository.save(balance);
    }

    return balance;
  }

  async getVendorTransactions(
    vendorId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const query = this.creditTransactionRepository.createQueryBuilder('transaction')
      .where('transaction.vendorId = :vendorId', { vendorId })
      .orderBy('transaction.createdAt', 'DESC');

    if (filters?.type) {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('transaction.status = :status', { status: filters.status });
    }

    const [transactions, total] = await query
      .skip((filters?.page || 0) * (filters?.limit || 10))
      .take(filters?.limit || 10)
      .getManyAndCount();

    return { transactions, total };
  }

  async purchaseCredits(vendorId: string, purchaseDto: PurchaseCreditsDto): Promise<CreditTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create transaction record
      const transaction = this.creditTransactionRepository.create({
        vendorId,
        amount: purchaseDto.credits,
        currency: purchaseDto.currency || 'USD',
        type: TransactionType.PURCHASE,
        status: TransactionStatus.PENDING,
        description: `Purchase of ${purchaseDto.credits} credits`,
        metadata: {
          paymentMethodId: purchaseDto.paymentMethodId,
        },
      });

      const savedTransaction = await queryRunner.manager.save(CreditTransaction, transaction);

      // TODO: Process payment with Stripe
      // For now, we'll simulate successful payment
      savedTransaction.status = TransactionStatus.COMPLETED;
      savedTransaction.stripePaymentIntentId = `pi_${Date.now()}`;
      await queryRunner.manager.save(CreditTransaction, savedTransaction);

      // Update vendor balance
      await this.updateVendorBalance(
        queryRunner,
        vendorId,
        purchaseDto.credits,
        TransactionType.PURCHASE
      );

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async useCredits(vendorId: string, useDto: UseCreditsDto): Promise<CreditTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if vendor has sufficient credits
      const balance = await this.getVendorBalance(vendorId);
      if (balance.balance < useDto.credits) {
        throw new BadRequestException('Insufficient credits');
      }

      // Create transaction record
      const transaction = this.creditTransactionRepository.create({
        vendorId,
        amount: useDto.credits,
        currency: 'USD',
        type: TransactionType.USAGE,
        status: TransactionStatus.COMPLETED,
        description: useDto.description,
        metadata: useDto.metadata,
      });

      const savedTransaction = await queryRunner.manager.save(CreditTransaction, transaction);

      // Update vendor balance
      await this.updateVendorBalance(
        queryRunner,
        vendorId,
        useDto.credits,
        TransactionType.USAGE
      );

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addBonusCredits(
    vendorId: string,
    amount: number,
    description: string,
    adminId: string
  ): Promise<CreditTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create transaction record
      const transaction = this.creditTransactionRepository.create({
        vendorId,
        amount,
        currency: 'USD',
        type: TransactionType.BONUS,
        status: TransactionStatus.COMPLETED,
        description,
        metadata: {
          addedBy: adminId,
          reason: 'admin_bonus',
        },
      });

      const savedTransaction = await queryRunner.manager.save(CreditTransaction, transaction);

      // Update vendor balance
      await this.updateVendorBalance(
        queryRunner,
        vendorId,
        amount,
        TransactionType.BONUS
      );

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async refundCredits(
    transactionId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<CreditTransaction> {
    const originalTransaction = await this.creditTransactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!originalTransaction) {
      throw new NotFoundException('Original transaction not found');
    }

    if (originalTransaction.type !== TransactionType.PURCHASE) {
      throw new BadRequestException('Can only refund purchase transactions');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create refund transaction
      const refundTransaction = this.creditTransactionRepository.create({
        vendorId: originalTransaction.vendorId,
        amount,
        currency: originalTransaction.currency,
        type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED,
        description: `Refund: ${reason}`,
        metadata: {
          originalTransactionId: transactionId,
          refundedBy: adminId,
          reason,
        },
      });

      const savedRefund = await queryRunner.manager.save(CreditTransaction, refundTransaction);

      // Update vendor balance
      await this.updateVendorBalance(
        queryRunner,
        originalTransaction.vendorId,
        amount,
        TransactionType.REFUND
      );

      await queryRunner.commitTransaction();
      return savedRefund;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async updateVendorBalance(
    queryRunner: any,
    vendorId: string,
    amount: number,
    type: TransactionType
  ): Promise<void> {
    let balance = await queryRunner.manager.findOne(VendorCreditBalance, {
      where: { vendorId },
    });

    if (!balance) {
      balance = queryRunner.manager.create(VendorCreditBalance, {
        vendorId,
        balance: 0,
        currency: 'USD',
        totalPurchased: 0,
        totalUsed: 0,
        totalRefunded: 0,
      });
    }

    switch (type) {
      case TransactionType.PURCHASE:
      case TransactionType.BONUS:
        balance.balance += amount;
        if (type === TransactionType.PURCHASE) {
          balance.totalPurchased += amount;
        }
        break;
      case TransactionType.USAGE:
        balance.balance -= amount;
        balance.totalUsed += amount;
        break;
      case TransactionType.REFUND:
        balance.balance += amount;
        balance.totalRefunded += amount;
        break;
    }

    await queryRunner.manager.save(VendorCreditBalance, balance);
  }

  async getCreditStats(vendorId?: string): Promise<{
    totalVendors: number;
    totalCreditsPurchased: number;
    totalCreditsUsed: number;
    totalCreditsRefunded: number;
    averageBalance: number;
  }> {
    const query = this.creditBalanceRepository.createQueryBuilder('balance');
    
    if (vendorId) {
      query.where('balance.vendorId = :vendorId', { vendorId });
    }

    const balances = await query.getMany();

    const stats = balances.reduce(
      (acc, balance) => ({
        totalVendors: acc.totalVendors + 1,
        totalCreditsPurchased: acc.totalCreditsPurchased + Number(balance.totalPurchased),
        totalCreditsUsed: acc.totalCreditsUsed + Number(balance.totalUsed),
        totalCreditsRefunded: acc.totalCreditsRefunded + Number(balance.totalRefunded),
        averageBalance: acc.averageBalance + Number(balance.balance),
      }),
      {
        totalVendors: 0,
        totalCreditsPurchased: 0,
        totalCreditsUsed: 0,
        totalCreditsRefunded: 0,
        averageBalance: 0,
      }
    );

    if (stats.totalVendors > 0) {
      stats.averageBalance = stats.averageBalance / stats.totalVendors;
    }

    return stats;
  }
}
