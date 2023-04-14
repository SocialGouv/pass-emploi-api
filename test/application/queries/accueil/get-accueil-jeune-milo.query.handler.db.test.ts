import { describe } from 'mocha'
import { expect, StubbedClass, stubClass } from '../../../utils'

import { isSuccess, Result } from '../../../../src/building-blocks/types/result'

import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { GetAccueilJeuneMiloQueryHandler } from '../../../../src/application/queries/accueil/get-accueil-jeune-milo.query.handler.db'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/authorize-jeune'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { ActionSqlModel } from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import { Action } from '../../../../src/domain/action/action'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { GetRecherchesSauvegardeesQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import {
  unRendezVousJeuneDetailQueryModel,
  unRendezVousQueryModel
} from '../../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { AccueilJeuneMiloQueryModel } from '../../../../src/application/queries/query-models/jeunes.milo.query-model'
import { CodeTypeRendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { DateTime } from 'luxon'
import { uneAgenceMiloDTO } from '../../../fixtures/sql-models/agence.sql-model'
import { AgenceSqlModel } from '../../../../src/infrastructure/sequelize/models/agence.sql-model'
import { GetFavorisAccueilQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-favoris.query.getter.db'

describe('GetAccueilJeuneMiloQueryHandler', () => {
  let handler: GetAccueilJeuneMiloQueryHandler
  let alertesQueryGetter: StubbedClass<GetRecherchesSauvegardeesQueryGetter>
  let favorisAccueilQueryGetter: StubbedClass<GetFavorisAccueilQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  before(async () => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    alertesQueryGetter = stubClass(GetRecherchesSauvegardeesQueryGetter)
    favorisAccueilQueryGetter = stubClass(GetFavorisAccueilQueryGetter)
    handler = new GetAccueilJeuneMiloQueryHandler(
      jeuneAuthorizer,
      alertesQueryGetter,
      favorisAccueilQueryGetter
    )
  })

  describe('handle', () => {
    let result: Result<AccueilJeuneMiloQueryModel>
    let query: { idJeune: string; maintenant: string }

    const maintenantString = '2023-03-27T03:24:00'
    const maintenant = DateTime.fromISO(maintenantString)

    before(async () => {
      query = {
        idJeune: 'idJeune',
        maintenant: maintenantString
      }

      await AgenceSqlModel.bulkCreate([
        uneAgenceMiloDTO({ id: 'bonne-agence-id' }),
        uneAgenceMiloDTO({ id: 'fake-agence-id' })
      ])

      const conseiller = await ConseillerSqlModel.create(
        unConseillerDto({ idAgence: 'bonne-agence-id' })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: query.idJeune,
          idConseiller: conseiller.id
        })
      )
    })
    after(async () => {
      await AgenceSqlModel.destroy({ truncate: true, cascade: true })
    })

    describe('retourne les indicateurs du restant de la semaine', () => {
      let rendezVousCetteSemaine: RendezVousSqlModel

      before(async () => {
        // Given
        const actionARealiserDto = uneActionDto({
          idJeune: query.idJeune,
          dateEcheance: maintenant.plus({ days: 2 }).toJSDate(),
          statut: Action.Statut.EN_COURS
        })
        const actionEnRetardDto = uneActionDto({
          idJeune: query.idJeune,
          dateEcheance: maintenant.minus({ days: 1 }).toJSDate(),
          statut: Action.Statut.EN_COURS
        })
        await ActionSqlModel.bulkCreate([actionARealiserDto, actionEnRetardDto])

        rendezVousCetteSemaine = await RendezVousSqlModel.create(
          unRendezVousDto({
            dateSuppression: null,
            date: maintenant.plus({ days: 2 }).toJSDate()
          })
        )
        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: query.idJeune,
          idRendezVous: rendezVousCetteSemaine.id
        })
      })
      after(async () => {
        await ActionSqlModel.destroy({ truncate: true, cascade: true })
        await RendezVousSqlModel.destroy({ truncate: true, cascade: true })
      })

      it('compte les rendez-vous', async () => {
        // When
        result = await handler.handle(query)

        // Then
        expect(
          isSuccess(result) && result.data.cetteSemaine.nombreRendezVous
        ).to.deep.equal(1)
      })
      it('compte les actions en retard', async () => {
        // When
        result = await handler.handle(query)

        // Then
        expect(
          isSuccess(result) &&
            result.data.cetteSemaine.nombreActionsDemarchesEnRetard
        ).to.deep.equal(1)
      })
      it('compte les actions à réaliser', async () => {
        // When
        result = await handler.handle(query)

        // Then
        expect(
          isSuccess(result) &&
            result.data.cetteSemaine.nombreActionsDemarchesARealiser
        ).to.deep.equal(1)
      })
    })

    describe('retourne le prochain rendez-vous', () => {
      const dansDeuxSemainesDateJS = maintenant.plus({ week: 2 }).toJSDate()
      let prochainRendezVousDans2Semaines: RendezVousSqlModel

      before(async () => {
        // Given
        prochainRendezVousDans2Semaines = await RendezVousSqlModel.create(
          unRendezVousDto({
            dateSuppression: null,
            date: dansDeuxSemainesDateJS
          })
        )
        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: query.idJeune,
          idRendezVous: prochainRendezVousDans2Semaines.id
        })
      })
      after(async () => {
        await RendezVousSqlModel.destroy({ truncate: true, cascade: true })
      })

      it('retourne le prochain rendez-vous ', async () => {
        // When
        result = await handler.handle(query)

        // Then
        expect(
          isSuccess(result) && result.data.prochainRendezVous
        ).to.deep.equal(
          unRendezVousQueryModel({
            id: prochainRendezVousDans2Semaines.id,
            date: dansDeuxSemainesDateJS
          })
        )
      })
    })

    describe('retourne les 3 prochains événements à venir', () => {
      let evenementAVenir1: AsSql<RendezVousDto>
      let evenementAVenir2: AsSql<RendezVousDto>
      let evenementAVenir3: AsSql<RendezVousDto>
      let evenementPasse: AsSql<RendezVousDto>
      let evenementAVenirAutreAgence: AsSql<RendezVousDto>
      let evenementAVenir4HorsPage: AsSql<RendezVousDto>

      before(async () => {
        // Given
        evenementAVenir1 = unRendezVousDto({
          date: maintenant.plus({ day: 1 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
        })
        evenementAVenir2 = unRendezVousDto({
          date: maintenant.plus({ day: 3 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
        })
        evenementAVenir3 = unRendezVousDto({
          date: maintenant.plus({ day: 4 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
        })
        evenementPasse = unRendezVousDto({
          date: maintenant.minus({ day: 1 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
        })
        evenementAVenirAutreAgence = unRendezVousDto({
          date: maintenant.plus({ day: 2 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'fake-agence-id'
        })
        evenementAVenir4HorsPage = unRendezVousDto({
          date: maintenant.plus({ day: 5 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
        })
        await RendezVousSqlModel.bulkCreate([
          evenementPasse,
          evenementAVenir1,
          evenementAVenirAutreAgence,
          evenementAVenir2,
          evenementAVenir3,
          evenementAVenir4HorsPage
        ])
      })
      after(() => {
        RendezVousSqlModel.destroy({ truncate: true, cascade: true })
      })

      it('retourne les 3 prochains événements à venir', async () => {
        // When
        result = await handler.handle(query)

        // Then
        expect(isSuccess(result) && result.data.evenementsAVenir).to.deep.equal(
          [
            unRendezVousJeuneDetailQueryModel({
              id: evenementAVenir1.id,
              date: maintenant.plus({ day: 1 }).toJSDate(),
              type: {
                code: CodeTypeRendezVous.ATELIER,
                label: 'Atelier'
              },
              title: 'rdv',
              modality: 'modalite'
            }),
            unRendezVousJeuneDetailQueryModel({
              id: evenementAVenir2.id,
              date: maintenant.plus({ day: 3 }).toJSDate(),
              type: {
                code: CodeTypeRendezVous.ATELIER,
                label: 'Atelier'
              },
              title: 'rdv',
              modality: 'modalite'
            }),
            unRendezVousJeuneDetailQueryModel({
              id: evenementAVenir3.id,
              date: maintenant.plus({ day: 4 }).toJSDate(),
              type: {
                code: CodeTypeRendezVous.ATELIER,
                label: 'Atelier'
              },
              title: 'rdv',
              modality: 'modalite'
            })
          ]
        )
      })
    })

    it('appelle la query pour récupérer les 3 dernières alertes (recherches sauvegardées)', async () => {
      // Given
      alertesQueryGetter.handle.resolves([])

      // When
      result = await handler.handle(query)

      // Then
      expect(
        isSuccess(result) && alertesQueryGetter.handle
      ).to.have.been.calledWithExactly({ idJeune: query.idJeune })
    })

    it('appelle la query pour récupérer les 3 derniers favoris', async () => {
      // Given
      favorisAccueilQueryGetter.handle.resolves([])

      // When
      result = await handler.handle(query)

      // Then
      expect(
        isSuccess(result) && favorisAccueilQueryGetter.handle
      ).to.have.been.calledWithExactly({ idJeune: query.idJeune })
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
