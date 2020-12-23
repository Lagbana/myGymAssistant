import { Controller, Delete, Get, Param, UseInterceptors } from '@nestjs/common';
import { MorganInterceptor } from 'nest-morgan';
import { CrawlerService, CrawlerResponse } from './crawler.service'

@Controller()
export class CrawlerController {
    constructor(private readonly crawlerService: CrawlerService) { }
    
    @UseInterceptors(MorganInterceptor('dev'))
    @Get('/crawl')
    async crawl(): Promise<CrawlerResponse> {
        const res =  await this.crawlerService.crawl()
        return res
    }
    
    @UseInterceptors(MorganInterceptor('dev'))
    @Delete('/cancel/:day')
    async cancel(@Param('day') day: string): Promise<void> {
        await this.crawlerService.cancelSession(day)
    }
}
