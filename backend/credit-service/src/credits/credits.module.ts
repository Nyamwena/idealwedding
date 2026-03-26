import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { VendorCreditBalance } from './entities/vendor-credit-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreditTransaction, VendorCreditBalance])],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
