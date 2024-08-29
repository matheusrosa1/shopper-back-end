import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasureModule } from './measure/measure.module';
import { GeminiService } from './gemini/analyze-image.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.development.local', '.env.development'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      entities: [`${__dirname}/**/*.entity{.ts,.js}`],
      migrations: [`${__dirname}/migrations/*{.ts,.js}`],
      migrationsRun: true,
    }),
    MeasureModule,
  ],
  controllers: [AppController],
  providers: [AppService, GeminiService],
})
export class AppModule {}
