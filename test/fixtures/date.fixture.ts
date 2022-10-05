import { DateTime } from 'luxon'

export const uneDatetime = (): DateTime =>
  DateTime.fromISO('2020-04-06T12:00:00.000Z')

export const uneDatetimeAvecOffset = (): DateTime =>
  DateTime.fromISO('2020-04-06T12:00:00.000Z', { setZone: true })

export const uneDatetimeLocale = (): DateTime =>
  DateTime.fromISO('2020-04-06T12:00:00.000')

export const uneAutreDatetime = (): DateTime =>
  DateTime.fromISO('2020-04-07T12:00:00.000Z')

export const uneDatetimeMoinsRecente = DateTime.fromISO(
  '2019-04-06T12:00:00.000Z'
)
export const uneDatetimeMinuit = DateTime.fromISO('2020-04-06T00:00:00.000Z')

export const uneDate = (): Date => new Date('2022-03-01T03:24:00')
export const uneAutreDate = (): Date => new Date('2022-04-01T03:24:00')
