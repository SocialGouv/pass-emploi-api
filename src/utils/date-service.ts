import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'

@Injectable()
export class DateService {
  now(): DateTime {
    return DateTime.now()
  }

  nowJs(): Date {
    return new Date()
  }

  nowAtMidnight(): DateTime {
    const now: DateTime = DateTime.now()
    now.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    return now
  }

  nowAtMidnightJs(): Date {
    const now: Date = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }

  static isSameDateDay(date1: DateTime, date2: DateTime): boolean {
    return date1.toUTC().startOf('day').equals(date2.toUTC().startOf('day'))
  }

  static isBetweenDates(
    dateAComparer: Date,
    dateMin: Date,
    dateMax: Date
  ): boolean {
    return dateAComparer >= dateMin && dateAComparer <= dateMax
  }

  fromISOStringToJSDate(stringISO: string): Date {
    return DateTime.fromISO(stringISO).toJSDate()
  }

  static fromJSDateToISOString(date: Date): string {
    return DateTime.fromJSDate(date).toISO()
  }

  static fromStringToDateTime(
    dateString?: string | null
  ): DateTime | undefined {
    return dateString ? DateTime.fromISO(dateString) : undefined
  }

  static fromStringToLocaleDateTime(
    dateString?: string | null
  ): DateTime | undefined {
    return dateString
      ? DateTime.fromISO(dateString, { setZone: true })
      : undefined
  }

  static fromJSDateToDateTime(jsDate: Date | null): DateTime | undefined {
    return jsDate ? DateTime.fromJSDate(jsDate) : undefined
  }
}
