import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MorganModule, MorganInterceptor } from 'nest-morgan';
import { CrawlerModule } from './crawler/crawler.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [
    HomeModule,
    CrawlerModule,
    MorganModule.forRoot(),
    ConfigModule.forRoot()
  ],
  controllers: [],
  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: MorganInterceptor('dev'),
  },],
})
export class AppModule { }
