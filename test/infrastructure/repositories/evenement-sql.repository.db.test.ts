import { Authentification } from '../../../src/domain/authentification'
import { expect } from '../../utils'
import { Core } from '../../../src/domain/core'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { Evenement } from '../../../src/domain/evenement'
import { EvenementSqlRepository } from '../../../src/infrastructure/repositories/evenement-sql.repository.db'
import { getDatabase } from '../../utils/database-for-testing'
import { EvenementEngagementHebdoSqlModel } from '../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'

describe('EvenementSqlRepository', () => {
  let evenementHttpSqlRepository: EvenementSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
    evenementHttpSqlRepository = new EvenementSqlRepository()
  })

  describe('saveEvenement', () => {
    it("enregistre l'évènement en base", async () => {
      // Given
      const utilisateur: Authentification.Utilisateur = {
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
      const codeEvenement = Evenement.Code.ACTION_STATUT_MODIFIE

      // When
      const result = await evenementHttpSqlRepository.save({
        code: codeEvenement,
        categorie: categorieEvenement,
        action: actionEvenement,
        date: uneDatetime().toJSDate(),
        utilisateur
      })

      // Then
      const evenementHebdo = await EvenementEngagementHebdoSqlModel.findAll()

      expect(evenementHebdo.length).to.equal(1)
      expect(evenementHebdo[0].get()).excluding('id').to.deep.equal({
        action: actionEvenement,
        code: codeEvenement,
        categorie: categorieEvenement,
        nom: null,
        idUtilisateur: utilisateur.id,
        typeUtilisateur: utilisateur.type,
        structure: utilisateur.structure,
        dateEvenement: uneDatetime().toJSDate()
      })
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
