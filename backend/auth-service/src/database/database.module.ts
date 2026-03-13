import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL', 'postgresql://idealweddings:idealweddings123@localhost:5432/idealweddings');
        
        // Parse database URL to determine type
        let config: any = {
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };

        if (databaseUrl.startsWith('sqlite://')) {
          // SQLite configuration
          const dbPath = databaseUrl.replace('sqlite://', '');
          config = {
            ...config,
            type: 'sqlite',
            database: dbPath,
          };
        } else if (databaseUrl.startsWith('mysql://')) {
          // MySQL configuration
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
          // PostgreSQL configuration (default)
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