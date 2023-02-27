import { describe } from 'mocha'
import { expect, StubbedClass, stubClass } from '../../utils'

import { success } from '../../../src/building-blocks/types/result'

import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/get-accueil-jeune-milo-query-handler'
import { JeuneAuthorizer } from 'src/application/authorizers/authorize-jeune'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { unRendezVousDto } from 'test/fixtures/sql-models/rendez-vous.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { Action } from 'src/domain/action/action'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { getDatabase } from 'test/utils/database-for-testing'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { Core } from 'src/domain/core'

describe('GetAccueilJeuneMiloQueryHandler', () => {
  let handler: GetAccueilJeuneMiloQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    handler = new GetAccueilJeuneMiloQueryHandler(jeuneAuthorizer)
  })

  describe('handle', () => {
    it("retourne une page d'accueil MILO", async () => {
      // Given
      const query = {
        idJeune: 'idJeune',
        maintenant: '2023-03-27T03:24:00'
      }

      const conseiller = await ConseillerSqlModel.create(unConseillerDto())
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: query.idJeune,
          idConseiller: conseiller.id,
          structure: Core.Structure.MILO
        })
      )

      await RendezVousSqlModel.create(
        unRendezVousDto({
          dateSuppression: null,
          date: new Date('2023-03-28T03:24:00')
        })
      ).then(async rdv => {
        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: query.idJeune,
          idRendezVous: rdv.id
        })
      })

      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: query.idJeune,
          dateEcheance: new Date('2023-03-29T03:24:00'),
          statut: Action.Statut.EN_COURS
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: query.idJeune,
          dateEcheance: new Date('2023-03-26T03:24:00'),
          statut: Action.Statut.EN_COURS
        })
      )

      const result = await handler.handle(query)

      expect(result).to.deep.equal(
        success({
          cetteSemaine: {
            nombreActionsDemarchesARealiser: 0,
            nombreActionsDemarchesEnRetard: 1,
            nombreRendezVous: 0
          },
          dateDerniereMiseAJour: undefined,
          evenementsAVenir: [],
          mesAlertes: [],
          mesFavoris: [],
          prochainRendezVous: undefined
        })
      )
    })
  })

  describe('authorize', () => {
    it('autorise un jeune MILO', () => {
      // Given
      const query = {
        idJeune: 'idJeune',
        maintenant: '2023-12-12'
      }

      // When
      handler.authorize(query, unUtilisateurJeune())

      // Then
      expect(jeuneAuthorizer.authorizeJeune).to.have.been.calledWithExactly(
        query.idJeune,
        unUtilisateurJeune()
      )
    })
  })
})
