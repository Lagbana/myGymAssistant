import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';

export interface CrawlerResponse {
    msg: string,
    status: number
}

@Injectable()
export class CrawlerService {
    constructor(private configService: ConfigService) { }

    async crawl(): Promise<CrawlerResponse> {
        const EMAIL = this.configService.get<string>('EMAIL')
        const PASSWORD = this.configService.get<string>('PASSWORD')
        const browser = await puppeteer.launch({ headless: false }) // ! SET BACK TO TRUE
        const page = await browser.newPage()

        const navigationPromise = page.waitForNavigation()

        await page.goto('https://myfit4less.gymmanager.com/portal/login.asp')

        await page.setViewport({ width: 792, height: 938 })

        // Input email
        await page.waitForSelector('#API > #block_fields #emailaddress')
        await page.click('#API > #block_fields #emailaddress')
        await page.type('#API > #block_fields #emailaddress', `${EMAIL}`)

        // Input password
        await page.waitForSelector('#API > #block_fields #password')
        await page.click('#API > #block_fields #password')
        await page.type('#API > #block_fields #password', `${PASSWORD}`)

        // Submit
        await page.waitForSelector('.login-box > #API > #block_buttons #loginButton')
        await page.click('.login-box > #API > #block_buttons #loginButton')

        await navigationPromise

        await page.waitForSelector('#doorPolicyForm .reserved-slots .time-slot .time-slot-box')

        const existingBookings = await page.evaluate(this.scheduledBookings)
        if (existingBookings.fullyBooked) {
            await browser.close()
            return {
            msg: `Fit4less sessions fully booked`,
            status: 304
            }
        }

        // Find club from list of clubs
        await page.waitForSelector('.col-md-12 #btn_club_select')
        await page.click('.col-md-12 #btn_club_select')

        // Get my regular club
        await page.waitForSelector('.modal-dialog #club_55346EEC-71F1-4A6E-BD17-5D4EA39E144B')
        await page.click('.modal-dialog #club_55346EEC-71F1-4A6E-BD17-5D4EA39E144B')

        await navigationPromise

        await page.waitForSelector('.col-md-12 #btn_date_select')
        // const existingBookings = await page.evaluate(this.scheduledBookings)

        // if (existingBookings.fullyBooked) return null


        
        if (existingBookings.numOfBookings === 1) {
            const nextDayBookings = await page.evaluate(this.getNextDayBookings)
            await page.waitForSelector(`.modal-dialog #${nextDayBookings.possibleDaysIDs[0]}`)
            await page.click(`.modal-dialog #${nextDayBookings.possibleDaysIDs[0]}`)
            await navigationPromise
            await page.waitForSelector('#doorPolicyForm .available-slots')
            const bookingResponse = await page.evaluate(this.bookSession)

            if (bookingResponse !== null ) {
                await page.waitForSelector('#modal_booking #dialog_book_yes')
                await page.click('#modal_booking #dialog_book_yes') 
                await navigationPromise
            } else {
                const retryNextDayBookings = await page.evaluate(this.getNextDayBookings)
                await page.waitForSelector(`.modal-dialog #${retryNextDayBookings.possibleDaysIDs[1]}`)
                await page.click(`.modal-dialog #${retryNextDayBookings.possibleDaysIDs[1]}`)
                await navigationPromise
                await page.waitForSelector('#doorPolicyForm .available-slots')
                await page.evaluate(this.bookSession)
                await page.waitForSelector('#modal_booking #dialog_book_yes')
                await page.click('#modal_booking #dialog_book_yes')
                await navigationPromise
            }

        }

        if (existingBookings.numOfBookings === 0) {
            const nextDayBookings = await page.evaluate(this.getNextDayBookings)
            await page.waitForSelector(`.modal-dialog #${nextDayBookings.possibleDaysIDs[0]}`)
            await page.click(`.modal-dialog #${nextDayBookings.possibleDaysIDs[0]}`)
            await navigationPromise
            await page.waitForSelector('#doorPolicyForm .available-slots')
            const firstBookingResponse = await page.evaluate(this.bookSession)

            if (firstBookingResponse !== null ) {
                await page.waitForSelector('#modal_booking #dialog_book_yes')
                await page.click('#modal_booking #dialog_book_yes') 
                await navigationPromise
            }

            const retryNextDayBookings = await page.evaluate(this.getNextDayBookings)
            await page.waitForSelector(`.modal-dialog #${retryNextDayBookings.possibleDaysIDs[1]}`)
            await page.click(`.modal-dialog #${retryNextDayBookings.possibleDaysIDs[1]}`)
            await navigationPromise
            await page.waitForSelector('#doorPolicyForm .available-slots')
            const secondBookingResponse = await page.evaluate(this.bookSession)

            if (secondBookingResponse !== null) {
                await page.waitForSelector('#modal_booking #dialog_book_yes')
                await page.click('#modal_booking #dialog_book_yes')
                await navigationPromise
            }

        }

        await browser.close()

        return {
            msg: `Fit4less session successfully booked`,
            status: 200
        }
    }

    private getNextDayBookings() {
        const reserveButton: HTMLElement = document.querySelector('.col-md-12 #btn_date_select')
        reserveButton.click()

        const possibleDays = document.querySelectorAll('#modal_dates .modal-dialog .modal-content .modal-body .dialog-content .button.md-option ')
        // Get day one
        const dayOneElement = possibleDays[1] as HTMLElement 
        const dayTwoElement = possibleDays[2] as HTMLElement

        const dayOne = dayOneElement.innerText.trim().toLowerCase()
        const dayTwo = dayOneElement.innerText.trim().toLowerCase()

        return {
            nextDay: [dayOne, dayTwo],
            possibleDaysIDs: [dayOneElement.id, dayTwoElement.id]
        }         
    }

    private scheduledBookings() {
        // Check for existing bookings
        const scheduledBookings: NodeListOf<any> = document.querySelectorAll("#doorPolicyForm .reserved-slots .time-slot .time-slot-box ")
        const numOfBookings = scheduledBookings.length

        let fullyBooked: boolean = false
        if (numOfBookings >= 2) {
            fullyBooked = true
        }
        return {
            numOfBookings,
            fullyBooked
        }
    }
    
    private bookSession() {
        let day: string
        let time: string
        let isWeekDay: boolean = false
        let isWeekEnd: boolean = false
        let preferredWeekDayTime: string = `7:00 AM`    //TODO: pass in from client
        let preferredWeekEndTime: string = `8:00 AM`    //TODO: pass in from client

        const WEEK_DAYS: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        const WEEK_ENDS: string[] = ['saturday', 'sunday']

        const container = document.querySelectorAll(`#doorPolicyForm > .available-slots `)
        const availableSlotsContainer = container[1] as HTMLElement
        const availableSlots = availableSlotsContainer.children as unknown as HTMLElement[]

        if (availableSlots.length === 0) return null

        for (let element of availableSlots) {
            day = element.getAttribute("data-slotdate").split(' ')[0].toLowerCase().split(',')[0]
            time = element.getAttribute("data-slottime").split(' ').slice(1, 3).join(' ')
            isWeekDay = WEEK_DAYS.includes(day)
            isWeekEnd = WEEK_ENDS.includes(day)

            if ((isWeekDay && time === preferredWeekDayTime) || (isWeekEnd && time === preferredWeekEndTime)) {
                return element.click()
            } 

        }
        
        return null
    }

    async cancelSession(day: string) {
        const EMAIL = this.configService.get<string>('EMAIL')
        const PASSWORD = this.configService.get<string>('PASSWORD')
        const browser = await puppeteer.launch({ headless: false }) // ! SET BACK TO TRUE
        const page = await browser.newPage()

        const navigationPromise = page.waitForNavigation()

        await page.goto('https://myfit4less.gymmanager.com/portal/login.asp')

        await page.setViewport({ width: 792, height: 938 })

        // Input email
        await page.waitForSelector('#API > #block_fields #emailaddress')
        await page.click('#API > #block_fields #emailaddress')
        await page.type('#API > #block_fields #emailaddress', `${EMAIL}`)

        // Input password
        await page.waitForSelector('#API > #block_fields #password')
        await page.click('#API > #block_fields #password')
        await page.type('#API > #block_fields #password', `${PASSWORD}`)

        // Submit
        await page.waitForSelector('.login-box > #API > #block_buttons #loginButton')
        await page.click('.login-box > #API > #block_buttons #loginButton')
        
        await navigationPromise
        
        await page.waitForSelector('#doorPolicyForm .reserved-slots .time-slot .time-slot-box')
        
        const isCancelled = await page.evaluate(this.deleteBookedSession, day)
        
        if (isCancelled) {            
            await page.waitForSelector('#modal_booking #dialog_cancel_yes')
            await page.click('#modal_booking #dialog_cancel_yes')
        }

    }

    private async deleteBookedSession(cancelDay: string): Promise<boolean> {
        const scheduledBookings = document.querySelectorAll("#doorPolicyForm .reserved-slots .time-slot") as unknown as HTMLElement[]

        for (let booked of scheduledBookings) {
            let day = booked.getAttribute("data-slotdate").split(' ')[0].toLowerCase().split(',')[0]
            if (cancelDay === day) {
                booked.click()
                return true
            }
        }

        return false

    }
}

 

