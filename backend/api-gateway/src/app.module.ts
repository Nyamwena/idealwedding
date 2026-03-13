import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendor/vendor.module';
import { QuoteModule } from './quote/quote.module';
import { GuestModule } from './guest/guest.module';
import { CreditModule } from './credit/credit.module';
import { HealthController } from './health/health.controller';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    AuthModule,
    VendorModule,
    QuoteModule,
    GuestModule,
    CreditModule,
  ],
  controllers: [HealthController],
  providers: [AppResolver],
})
export class AppModule {} 