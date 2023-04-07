import { describe } from 'mocha'
import { expect, StubbedClass, stubClass } from '../../../utils'

import {
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'

import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/accueil/get-accueil-jeune-milo.query.handler.db'
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
import { unRendezVousQueryModel } from 'test/fixtures/query-models/rendez-vous.query-model.fixtures'
import { RechercheSqlModel } from 'src/infrastructure/sequelize/models/recherche.sql-model'
import { GetRecherchesSauvegardeesQueryGetter } from 'src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { uneRechercheDto } from 'test/fixtures/sql-models/recherche.sql-model'
import { fromSqlToRechercheQueryModel } from 'src/application/queries/query-mappers/recherche.mapper'
import { AccueilJeuneMiloQueryModel } from '../../../../src/application/queries/query-models/jeunes.milo.query-model'

describe('GetAccueilJeuneMiloQueryHandler', () => {
  let handler: GetAccueilJeuneMiloQueryHandler
  let queryGetter: StubbedClass<GetRecherchesSauvegardeesQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    queryGetter = stubClass(GetRecherchesSauvegardeesQueryGetter)
    handler = new GetAccueilJeuneMiloQueryHandler(jeuneAuthorizer, queryGetter)
  })

  describe('handle', () => {
    let result: Result<AccueilJeuneMiloQueryModel>
    let query: { idJeune: string; maintenant: string }
    let unRendezVousAujourdhui: RendezVousSqlModel
    let rechercheSqlModel: RechercheSqlModel

    beforeEach(async () => {
      query = {
        idJeune: 'idJeune',
        maintenant: '2023-03-27T03:24:00'
      }

      const conseiller = await ConseillerSqlModel.create(unConseillerDto())

      await JeuneSqlModel.creer(
        unJeuneDto({
          id: query.idJeune,
          idConseiller: conseiller.id
        })
      )

      unRendezVousAujourdhui = await RendezVousSqlModel.create(
        unRendezVousDto({
          dateSuppression: null,
          date: new Date('2023-03-28T03:24:00')
        })
      )

      await RendezVousJeuneAssociationSqlModel.create({
        idJeune: query.idJeune,
        idRendezVous: unRendezVousAujourdhui.id
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

      const recherche = uneRechercheDto({
        id: 'dd2651d1-1ec0-4588-a3d3-26cf4e313e1a',
        idJeune: query.idJeune
      })

      rechercheSqlModel = await RechercheSqlModel.create(recherche)

      queryGetter.handle.resolves([
        fromSqlToRechercheQueryModel(rechercheSqlModel)
      ])

      result = await handler.handle(query)
    })

    //beforeEach(async () => {})

    it("retourne une page d'accueil MILO", async () => {
      expect(result).to.deep.equal(
        success({
          cetteSemaine: {
            nombreActionsDemarchesARealiser: 1,
            nombreActionsDemarchesEnRetard: 1,
            nombreRendezVous: 1
          },
          dateDerniereMiseAJour: undefined,
          evenementsAVenir: [],
          mesAlertes: [fromSqlToRechercheQueryModel(rechercheSqlModel)],
          mesFavoris: [],
          prochainRendezVous: unRendezVousQueryModel({
            id: unRendezVousAujourdhui.id,
            date: new Date('2023-03-28T03:24:00')
          })
        })
      )
    })

    it('retourne le prochain rendez-vous ', () => {
      // Then
      expect(isSuccess(result) && result.data.prochainRendezVous).to.deep.equal(
        unRendezVousQueryModel({
          id: unRendezVousAujourdhui.id,
          date: new Date('2023-03-28T03:24:00')
        })
      )
    })

    it('compte les rendez-vous du reste de la semaine', async () => {
      // Then
      expect(
        isSuccess(result) && result.data.cetteSemaine.nombreRendezVous
      ).to.deep.equal(1)
    })

    it('retourne un tableau de recherches sauvegardées', async () => {
      // Then
      expect(isSuccess(result) && result.data.prochainRendezVous).to.deep.equal(
        unRendezVousQueryModel({
          id: unRendezVousAujourdhui.id,
          date: new Date('2023-03-28T03:24:00')
        })
      )
    })

    it('compte les démarches en retard de la semaine', async () => {
      // Then
      expect(
        isSuccess(result) &&
          result.data.cetteSemaine.nombreActionsDemarchesEnRetard
      ).to.deep.equal(1)
    })

    it('compte les démarches à réaliser de la semaine', () => {
      // Then

      expect(
        isSuccess(result) &&
          result.data.cetteSemaine.nombreActionsDemarchesARealiser
      ).to.deep.equal(1)
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
