import { Module } from '@nestjs/common';
import { ScrapperController } from './scrapper/scrapper.controller';
import { ScrapperService } from './scrapper/scrapper.service';
import { ScrapperModule } from './scrapper/scrapper.module';

@Module({
  imports: [ScrapperModule],
  controllers: [ ScrapperController],
  providers: [ ScrapperService],
})
export class AppModule {}
