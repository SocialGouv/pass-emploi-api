import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'

export const JOUR_DE_LA_SEMAINE_LUNDI = 1

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

  static isGreater(greaterDate: DateTime, date: DateTime): boolean {
    return greaterDate.toUTC().startOf('day') > date.toUTC().startOf('day')
  }

  static isBetweenDates(
    dateAComparer: Date,
    dateMin: Date,
    dateMax: Date
  ): boolean {
    return dateMin <= dateAComparer && dateAComparer <= dateMax
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

  static calculerTempsExecution(dateDebut: DateTime): number {
    return dateDebut.diffNow().milliseconds * -1
  }
}
