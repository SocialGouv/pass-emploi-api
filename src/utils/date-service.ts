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

  nowAtMidnightJs(): Date {
    const now: Date = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }

  isSameDateDay(date1: DateTime, date2: DateTime): boolean {
    return date1.startOf('day').equals(date2.startOf('day'))
  }

  fromISOStringToUTCJSDate(stringISO: string): Date {
    return DateTime.fromISO(stringISO).toUTC().toJSDate()
  }
}
