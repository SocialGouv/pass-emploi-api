import { Authentification } from '../../../src/domain/authentification'
import { DatabaseForTesting, expect, stubClass } from '../../utils'
import { HttpService } from '@nestjs/axios'
import { testConfig } from '../../utils/module-for-testing'
import * as nock from 'nock'
import { EvenementHttpSqlRepository } from '../../../src/infrastructure/repositories/evenement-http-sql.repository'
import { DateService } from '../../../src/utils/date-service'
import { Core } from '../../../src/domain/core'
import { emptySuccess } from '../../../src/building-blocks/types/result'

describe('EvenementHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let evenementHttpSqlRepository: EvenementHttpSqlRepository
  const configService = testConfig()
  const httpService = new HttpService()
  const dateService = stubClass(DateService)

  beforeEach(async () => {
    evenementHttpSqlRepository = new EvenementHttpSqlRepository(
      httpService,
      configService,
      dateService
    )
  })

  describe('sendEvenement', () => {
    it('fait le bon appel http pour envoyer l"évènement à Matomo', async () => {
      // Given
      const evenement = {
        utilisateur: {
          id: '1',
          prenom: 'Kevin',
          nom: 'DeBrun',
          email: 'kd@gmail.com',
          structure: Core.Structure.MILO,
          type: Authentification.Type.CONSEILLER
        },
        categorieEvenement: 'Action',
        actionEvenement: 'Suppression'
      }

      nock('https://stats.data.gouv.fr')
        .post(
          '/matomo.php',
          'rec=1&idsite=1&dimension1=CONSEILLER&dimension2=MISSION_LOCALE&e_c=Action&e_a=Suppression'
        )
        .reply(200)
        .isDone()

      // When
      const result = await evenementHttpSqlRepository.sendEvenement(
        evenement.utilisateur,
        evenement.categorieEvenement,
        evenement.actionEvenement
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
