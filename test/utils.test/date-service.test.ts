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
