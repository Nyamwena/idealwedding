import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL', 'mysql://idealweddings:idealweddings@localhost:3306/idealweddings');
        
        let config: any = {
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };

        if (databaseUrl && databaseUrl.startsWith('mysql://')) {
          const url = new URL(databaseUrl);
          config = {
            ...config,
            type: 'mysql',
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            username: url.username,
            password: url.password,
            database: url.pathname.substring(1),
          };
        } else {
          config = {
            ...config,
            type: 'postgres',
            url: databaseUrl,
            ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
          };
        }

        return config;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
