import { Authentification } from '../../../src/domain/authentification'
import { DatabaseForTesting, expect, stubClass } from '../../utils'
import { HttpService } from '@nestjs/axios'
import { testConfig } from '../../utils/module-for-testing'
import * as nock from 'nock'
import { EvenementHttpSqlRepository } from '../../../src/infrastructure/repositories/evenement-http-sql.repository'
import { DateService } from '../../../src/utils/date-service'
import { Core } from '../../../src/domain/core'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { uneDatetime } from 'test/fixtures/date.fixture'

describe('EvenementHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let evenementHttpSqlRepository: EvenementHttpSqlRepository
  const configService = testConfig()
  const httpService = new HttpService()
  const dateService = stubClass(DateService)
  dateService.nowJs.returns(uneDatetime.toJSDate())

  beforeEach(async () => {
    evenementHttpSqlRepository = new EvenementHttpSqlRepository(
      httpService,
      configService,
      dateService
    )
  })

  describe('sendEvenement', () => {
    it("fait le bon appel http pour envoyer l'évènement à Matomo", async () => {
      // Given
      const utilisateur = {
        id: '1',
        prenom: 'Kevin',
        nom: 'DeBrun',
        email: 'kd@gmail.com',
        structure: Core.Structure.MILO,
        type: Authentification.Type.CONSEILLER
      }
      const categorieEvenement = 'Test'
      const actionEvenement = 'Test'

      nock('https://stats.data.gouv.fr')
        .post(
          '/matomo.php',
          'rec=1&idsite=1&dimension3=CONSEILLER&dimension4=MISSION_LOCALE&e_c=Test&e_a=Test'
        )
        .reply(200)
        .isDone()

      // When
      const result = await evenementHttpSqlRepository.sendEvenement(
        utilisateur,
        categorieEvenement,
        actionEvenement
      )

      // Then
      const resultEvenement = await EvenementEngagementSqlModel.findAll()

      expect(resultEvenement.length).to.equal(1)
      expect(resultEvenement[0].categorie).to.equal(categorieEvenement)
      expect(resultEvenement[0].idUtilisateur).to.equal(utilisateur.id)
      expect(resultEvenement[0].dateEvenement).to.deep.equal(
        uneDatetime.toJSDate()
      )
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
