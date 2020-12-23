import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { HomeController } from './home.controller'
import { HomeService } from './home.service'
import { AuthMiddleware } from '../user/auth.middleware'

@Module({
    imports: [],
    providers: [HomeService],
    controllers: [
        HomeController
    ],
    exports: []
})
export class HomeModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                { path: '/', method: RequestMethod.ALL },
            )
    }
}



