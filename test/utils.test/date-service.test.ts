import { expect } from 'chai'
import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'

const dateService = new DateService()

describe('DateService', () => {
  describe('isSameDateDay', () => {
    it('retourne true si la date est au meme jour, meme mois et meme année', () => {
      const date1 = DateTime.fromISO('2020-04-06T12:00:00.000Z')
      const date2 = DateTime.fromISO('2020-04-06T17:03:12.000Z')

      expect(DateService.isSameDateDay(date1, date2)).to.equal(true)
    })
  })

  describe('fromISOStringToJSDate', () => {
    it('retourne une date JS', () => {
      const dateString = '2020-04-06T12:00:00+02:00'
      const dateUTC = dateService.fromISOStringToJSDate(dateString)
      const expectedDateUTC = new Date('2020-04-06T10:00:00.000Z')

      expect(dateUTC).to.deep.equal(expectedDateUTC)
    })
  })
})
