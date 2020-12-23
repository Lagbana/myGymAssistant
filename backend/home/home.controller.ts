import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { MorganInterceptor } from 'nest-morgan';
import { HomeService } from './home.service'

@Controller()
export class HomeController {
    constructor(private readonly homeService: HomeService) { }
    
    @UseInterceptors(MorganInterceptor('dev'))
    @Get(['/', '/home'])
    getHome(): string {
        return this.homeService.getHome()
    }
}
