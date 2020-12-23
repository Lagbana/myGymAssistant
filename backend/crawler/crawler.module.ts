import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlerController } from './crawler.controller'
import { CrawlerService } from './crawler.service'
import { AuthMiddleware } from '../user/auth.middleware'

@Module({
    imports: [ConfigModule],
    providers: [CrawlerService],
    controllers: [
        CrawlerController
    ],
    exports: []
})
export class CrawlerModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                { path: '/crawl', method: RequestMethod.ALL },
                { path: '/cancel', method: RequestMethod.DELETE },
            )
    }
}
