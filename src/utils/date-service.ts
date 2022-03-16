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

  isSameDateDay(date1: DateTime, date2: DateTime): boolean {
    return date1.startOf('day').equals(date2.startOf('day'))
  }
}
