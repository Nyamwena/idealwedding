import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { Quote } from './entities/quote.entity';
import { QuoteResponse } from './entities/quote-response.entity';
import { NotificationService } from '../notifications/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteResponse]),
    HttpModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService, NotificationService],
  exports: [QuotesService, NotificationService],
})
export class QuotesModule {}
