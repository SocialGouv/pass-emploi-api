import { Authentification } from '../../../src/domain/authentification'
import { DatabaseForTesting, expect, stubClass } from '../../utils'
import { EvenementHttpSqlRepository } from '../../../src/infrastructure/repositories/evenement-http-sql.repository'
import { DateService } from '../../../src/utils/date-service'
import { Core } from '../../../src/domain/core'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { uneDatetime } from 'test/fixtures/date.fixture'
import Utilisateur = Authentification.Utilisateur

describe('EvenementHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let evenementHttpSqlRepository: EvenementHttpSqlRepository
  const dateService = stubClass(DateService)
  dateService.nowJs.returns(uneDatetime.toJSDate())

  beforeEach(async () => {
    evenementHttpSqlRepository = new EvenementHttpSqlRepository(dateService)
  })

  describe('saveEvenement', () => {
    it("enregistre l'évènement en base", async () => {
      // Given
      const utilisateur: Utilisateur = {
        id: '1',
        prenom: 'Kevin',
        nom: 'DeBrun',
        email: 'kd@gmail.com',
        structure: Core.Structure.MILO,
        type: Authentification.Type.CONSEILLER,
        roles: []
      }
      const categorieEvenement = 'Test'
      const actionEvenement = 'Test'

      // When
      const result = await evenementHttpSqlRepository.saveEvenement(
        utilisateur,
        categorieEvenement,
        actionEvenement
      )

      // Then
      const resultEvenement = await EvenementEngagementSqlModel.findAll()

      expect(resultEvenement.length).to.equal(1)
      expect(resultEvenement[0].categorie).to.equal(categorieEvenement)
      expect(resultEvenement[0].idUtilisateur).to.equal(utilisateur.id)
      expect(resultEvenement[0].typeUtilisateur).to.equal(utilisateur.type)
      expect(resultEvenement[0].structure).to.equal(utilisateur.structure)
      expect(resultEvenement[0].dateEvenement).to.deep.equal(
        uneDatetime.toJSDate()
      )
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
