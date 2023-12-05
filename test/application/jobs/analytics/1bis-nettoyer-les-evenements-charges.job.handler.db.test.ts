import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { NettoyerEvenementsChargesAnalyticsJobHandler } from '../../../../src/application/jobs/analytics/1bis-nettoyer-les-evenements-charges.job.handler.db'
import { SuiviJob } from '../../../../src/domain/suivi-job'
import { EvenementEngagementHebdoSqlModel } from '../../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { DateService } from '../../../../src/utils/date-service'
import { unEvenementEngagementDto } from '../../../fixtures/sql-models/evenement-engagement.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('NettoyerEvenementsChargesAnalyticsJobHandler', () => {
  let handler: NettoyerEvenementsChargesAnalyticsJobHandler
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>

  const maintenant = DateTime.fromISO('2023-11-03')

  before(async () => {
    await getDatabase().cleanPG()
    const sandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)

    dateService.now.returns(maintenant)

    handler = new NettoyerEvenementsChargesAnalyticsJobHandler(
      suiviJobService,
      dateService
    )
  })

  describe('handle', () => {
    it('supprime les actes d’engagement de plus d’une semaine', async () => {
      // Given
      await EvenementEngagementHebdoSqlModel.bulkCreate([
        unEvenementEngagementDto({
          id: 0,
          dateEvenement: maintenant.minus({ day: 9 }).toJSDate()
        }),
        unEvenementEngagementDto({
          id: 1,
          dateEvenement: maintenant.minus({ day: 7 }).toJSDate()
        }),
        unEvenementEngagementDto({
          id: 2,
          dateEvenement: maintenant.minus({ day: 2 }).toJSDate()
        })
      ])

      // When
      const actual = await handler.handle()

      // Then
      const actesEngagement = await EvenementEngagementHebdoSqlModel.findAll()
      expect(actesEngagement).to.have.length(0)
      expect(actual).excluding('tempsExecution').to.deep.equal({
        jobType: 'NETTOYER_EVENEMENTS_CHARGES_ANALYTICS',
        dateExecution: maintenant,
        succes: true,
        resultat: {},
        nbErreurs: 0
      })
    })
  })
})
