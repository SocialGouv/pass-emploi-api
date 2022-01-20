import { DateTime } from 'luxon'

export const uneDatetime = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
export const uneDatetimeMoinsRecente = DateTime.fromISO(
  '2019-04-06T12:00:00.000Z'
).toUTC()
