import { success } from 'src/building-blocks/types/result'
import { expect, stubClass } from 'test/utils'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { GetIdentiteJeunesQueryHandler } from '../../../src/application/queries/get-identite-jeunes.query.handler.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetIdentiteJeunesQueryHandler', () => {
  let conseillerAuthorizer: ConseillerAuthorizer
  let queryHandler: GetIdentiteJeunesQueryHandler
  before(() => {
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    queryHandler = new GetIdentiteJeunesQueryHandler(conseillerAuthorizer)
  })

  describe('handle', () => {
    beforeEach(async () => {
      await getDatabase().cleanPG()
    })

    it('renvoie l’identité des jeunes demandés', async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'id-conseiller' }))
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'id-conseiller-2' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-1',
          nom: 'Curie',
          prenom: 'Marie',
          idConseiller: 'id-conseiller'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-2',
          nom: 'Lovelace',
          prenom: 'Ada',
          idConseiller: 'id-conseiller'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-autre-conseiller',
          nom: 'Edison',
          prenom: 'Thomas',
          idConseiller: 'id-conseiller-2'
        })
      )

      // When
      const actual = await queryHandler.handle({
        idConseiller: 'id-conseiller',
        idsJeunes: [
          'id-jeune-1',
          'id-jeune-2',
          'id-jeune-autre-conseiller',
          'id-jeune-inexistant'
        ]
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          { id: 'id-jeune-1', nom: 'Curie', prenom: 'Marie' },
          { id: 'id-jeune-2', nom: 'Lovelace', prenom: 'Ada' }
        ])
      )
    })
  })

  describe('authorize', () => {
    it("appelle l'authorizer pour le conseiller", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      // When
      await queryHandler.authorize(
        { idConseiller: 'id-conseiller', idsJeunes: [] },
        utilisateur
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        'id-conseiller',
        utilisateur
      )
    })
  })
})
