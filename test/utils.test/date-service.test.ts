import { expect } from 'chai'
import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'

const dateService = new DateService()

describe('isSameDateDay', () => {
  it('retourne true si la date est au meme jour, meme mois et meme année', () => {
    const date1 = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
    const date2 = DateTime.fromISO('2020-04-06T17:03:12.000Z').toUTC()

    expect(dateService.isSameDateDay(date1, date2)).to.equal(true)
  })
})

describe('fromISOStringToUTCJSDate', () => {
  it('retourne une date JS en UTC', () => {
    const dateString = '2020-04-06T12:00:00+02:00'
    const dateUTC = dateService.fromISOStringToUTCJSDate(dateString)
    const expectedDateUTC = new Date('2020-04-06T10:00:00.000Z')

    expect(dateUTC).to.deep.equal(expectedDateUTC)
  })
  it("retourne une date JS en UTC quand la date n'a pas de timezone en heure d'été", () => {
    const dateString = '2020-04-06T12:00:00'
    const dateUTC = dateService.fromISOStringToUTCJSDate(dateString)
    const expectedDateUTC = new Date('2020-04-06T10:00:00.000Z')

    expect(dateUTC).to.deep.equal(expectedDateUTC)
  })
  it("retourne une date JS en UTC quand la date n'a pas de timezone en heure d'hiver", () => {
    const dateString = '2020-03-06T12:00:00'
    const dateUTC = dateService.fromISOStringToUTCJSDate(dateString)
    const expectedDateUTC = new Date('2020-03-06T11:00:00.000Z')

    expect(dateUTC).to.deep.equal(expectedDateUTC)
  })
})
