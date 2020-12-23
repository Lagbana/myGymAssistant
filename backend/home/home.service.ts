import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService {
    constructor() { }

    getHome():string {
        return `Welcome to the gym assistant app 🏋🏽‍♂️🧘🏾‍♂️💪🏽`
    }
}
