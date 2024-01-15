import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import {
  GetAccueilJeuneMiloQuery,
  GetAccueilJeuneMiloQueryHandler
} from 'src/application/queries/milo/get-accueil-jeune-milo.query.handler.db'
import { GetFavorisAccueilQueryGetter } from 'src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from 'src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { GetCampagneQueryGetter } from 'src/application/queries/query-getters/get-campagne.query.getter'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { AccueilJeuneMiloQueryModel } from 'src/application/queries/query-models/jeunes.milo.query-model'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'

import {
  failure,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Core, estMiloPassEmploi } from 'src/domain/core'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { CodeTypeRendezVous } from 'src/domain/rendez-vous/rendez-vous'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { AgenceSqlModel } from 'src/infrastructure/sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { uneCampagneQueryModel } from 'test/fixtures/campagne.fixture'
import {
  unRendezVousJeuneDetailQueryModel,
  unRendezVousQueryModel
} from 'test/fixtures/query-models/rendez-vous.query-model.fixtures'
import { uneSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { uneAgenceMiloDto } from 'test/fixtures/sql-models/agence.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from 'test/fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import { testConfig } from 'test/utils/module-for-testing'

describe('GetAccueilJeuneMiloQueryHandler', () => {
  let handler: GetAccueilJeuneMiloQueryHandler
  let databaseForTesting: DatabaseForTesting
  let sessionsQueryGetter: StubbedClass<GetSessionsJeuneMiloQueryGetter>
  let alertesQueryGetter: StubbedClass<GetRecherchesSauvegardeesQueryGetter>
  let favorisAccueilQueryGetter: StubbedClass<GetFavorisAccueilQueryGetter>
  let getCampagneQueryGetter: StubbedClass<GetCampagneQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  before(async () => {
    databaseForTesting = getDatabase()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    sessionsQueryGetter = stubClass(GetSessionsJeuneMiloQueryGetter)
    alertesQueryGetter = stubClass(GetRecherchesSauvegardeesQueryGetter)
    favorisAccueilQueryGetter = stubClass(GetFavorisAccueilQueryGetter)
    getCampagneQueryGetter = stubClass(GetCampagneQueryGetter)

    handler = new GetAccueilJeuneMiloQueryHandler(
      jeuneAuthorizer,
      sessionsQueryGetter,
      alertesQueryGetter,
      favorisAccueilQueryGetter,
      getCampagneQueryGetter,
      testConfig(),
      databaseForTesting.sequelize
    )
  })

  describe('handle', () => {
    let result: Result<AccueilJeuneMiloQueryModel>
    let accueilQuery: GetAccueilJeuneMiloQuery

    const token = 'token'
    const maintenantString = '2023-03-27T09:30:00'
    const datePlus30Jours = '2023-04-26T23:59:59.999'
    const maintenant = DateTime.fromISO(maintenantString)
    const campagneQueryModel = uneCampagneQueryModel()

    beforeEach(async () => {
      await getDatabase().cleanPG()
      accueilQuery = {
        idJeune: 'idJeune',
        maintenant: maintenantString,
        accessToken: token
      }

      await AgenceSqlModel.bulkCreate([
        uneAgenceMiloDto({ id: 'bonne-agence-id' }),
        uneAgenceMiloDto({ id: 'fake-agence-id' })
      ])

      const conseiller = await ConseillerSqlModel.create(
        unConseillerDto({ idAgence: 'bonne-agence-id' })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: accueilQuery.idJeune,
          idConseiller: conseiller.id,
          idPartenaire: 'idDossier'
        })
      )

      sessionsQueryGetter.handle
        .withArgs(accueilQuery.idJeune, 'idDossier', token, {
          periode: {
            debut: maintenant,
            fin: DateTime.fromISO(datePlus30Jours)
          }
        })
        .resolves(success([]))
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie une failure ', async () => {
        // Given
        await JeuneSqlModel.destroy({ where: { id: accueilQuery.idJeune } })

        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', accueilQuery.idJeune))
        )
      })
    })

    describe('quand le jeune existe sans ID partenaire', () => {
      it('renvoie une failure ', async () => {
        // Given
        await JeuneSqlModel.update(
          {
            idPartenaire: null
          },
          { where: { id: accueilQuery.idJeune } }
        )

        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(result).to.deep.equal(
          failure(new JeuneMiloSansIdDossier(accueilQuery.idJeune))
        )
      })
    })

    describe('retourne les indicateurs du restant de la semaine', () => {
      let rendezVousCetteSemaine: RendezVousSqlModel

      beforeEach(async () => {
        // Given
        const actionARealiserDto = uneActionDto({
          idJeune: accueilQuery.idJeune,
          dateEcheance: maintenant.plus({ days: 2 }).toJSDate(),
          statut: Action.Statut.EN_COURS
        })
        const actionEnRetard1Dto = uneActionDto({
          idJeune: accueilQuery.idJeune,
          dateEcheance: maintenant.minus({ days: 1 }).toJSDate(),
          statut: Action.Statut.EN_COURS
        })
        const actionEnRetard2Dto = uneActionDto({
          idJeune: accueilQuery.idJeune,
          dateEcheance: maintenant.minus({ hours: 1 }).toJSDate(),
          statut: Action.Statut.EN_COURS
        })
        await ActionSqlModel.bulkCreate([
          actionARealiserDto,
          actionEnRetard1Dto,
          actionEnRetard2Dto
        ])

        rendezVousCetteSemaine = await RendezVousSqlModel.create(
          unRendezVousDto({
            dateSuppression: null,
            date: maintenant.plus({ days: 2 }).toJSDate()
          })
        )
        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: accueilQuery.idJeune,
          idRendezVous: rendezVousCetteSemaine.id
        })
      })

      describe('compte les rendez-vous', () => {
        it('sans les sessions si le GetSessionsJeuneMiloQueryGetter renvoie une failure', async () => {
          // Given
          sessionsQueryGetter.handle
            .withArgs(accueilQuery.idJeune, 'idDossier', token, {
              periode: {
                debut: maintenant,
                fin: DateTime.fromISO(datePlus30Jours)
              }
            })
            .resolves(
              failure(new NonTrouveError('Jeune', accueilQuery.idJeune))
            )

          // When
          result = await handler.handle(accueilQuery)

          // Then
          expect(
            isSuccess(result) && result.data.cetteSemaine.nombreRendezVous
          ).to.deep.equal(1)
        })

        it('sans les sessions si le jeune n’en a pas où il est inscrit dans la semaine', async () => {
          // Given
          sessionsQueryGetter.handle
            .withArgs(accueilQuery.idJeune, 'idDossier', token, {
              periode: {
                debut: maintenant,
                fin: DateTime.fromISO(datePlus30Jours)
              }
            })
            .resolves(success([]))

          // When
          result = await handler.handle(accueilQuery)

          // Then
          expect(
            isSuccess(result) && result.data.cetteSemaine.nombreRendezVous
          ).to.deep.equal(1)
        })

        it('ainsi que les sessions si le jeune en a dans la semaine', async () => {
          const sessionAvecInscriptionCetteSemaine =
            uneSessionJeuneMiloQueryModel({
              dateHeureDebut: maintenant.plus({ days: 1 }).toISODate(),
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            })
          const sessionSansInscriptionCetteSemaine =
            uneSessionJeuneMiloQueryModel({
              dateHeureDebut: maintenant.plus({ days: 2 }).toISODate()
            })
          const sessionAvecInscriptionSemaineSuivant =
            uneSessionJeuneMiloQueryModel({
              dateHeureDebut: maintenant.plus({ days: 8 }).toISODate(),
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            })

          sessionsQueryGetter.handle
            .withArgs(accueilQuery.idJeune, 'idDossier', token, {
              periode: {
                debut: maintenant,
                fin: DateTime.fromISO(datePlus30Jours)
              }
            })
            .resolves(
              success([
                sessionAvecInscriptionCetteSemaine,
                sessionSansInscriptionCetteSemaine,
                sessionAvecInscriptionSemaineSuivant
              ])
            )

          // When
          result = await handler.handle(accueilQuery)

          // Then
          expect(
            isSuccess(result) && result.data.cetteSemaine.nombreRendezVous
          ).to.deep.equal(2)
        })
      })
      it('compte les actions en retard', async () => {
        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(
          isSuccess(result) &&
            result.data.cetteSemaine.nombreActionsDemarchesEnRetard
        ).to.deep.equal(1)
      })
      it('compte les actions à réaliser', async () => {
        // When
        result = await handler.handle(accueilQuery)

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

      beforeEach(async () => {
        // Given
        prochainRendezVousDans2Semaines = await RendezVousSqlModel.create(
          unRendezVousDto({
            dateSuppression: null,
            date: dansDeuxSemainesDateJS
          })
        )
        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: accueilQuery.idJeune,
          idRendezVous: prochainRendezVousDans2Semaines.id
        })
      })

      it('retourne le prochain rendez-vous ', async () => {
        // When
        result = await handler.handle(accueilQuery)

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

    describe('retourne une prochaine session Milo', () => {
      it('renseignée s’il y en a une', async () => {
        const sessionSansInscriptionAJPlus1 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 1 }).toISODate()
        })
        const sessionAvecInscriptionAJPlus12 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 12 }).toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })
        const sessionAvecInscriptionAJPlus23 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 23 }).toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })
        sessionsQueryGetter.handle
          .withArgs(accueilQuery.idJeune, 'idDossier', token, {
            periode: {
              debut: maintenant,
              fin: DateTime.fromISO(datePlus30Jours)
            }
          })
          .resolves(
            success([
              sessionSansInscriptionAJPlus1,
              sessionAvecInscriptionAJPlus12,
              sessionAvecInscriptionAJPlus23
            ])
          )

        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(
          isSuccess(result) && result.data.prochaineSessionMilo
        ).to.deep.equal(sessionAvecInscriptionAJPlus12)
      })

      it('à undefined s’il n’y en a pas', async () => {
        // Given
        sessionsQueryGetter.handle
          .withArgs(accueilQuery.idJeune, 'idDossier', token, {
            periode: {
              debut: maintenant,
              fin: DateTime.fromISO(datePlus30Jours)
            }
          })
          .resolves(success([]))

        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(
          isSuccess(result) && result.data.prochaineSessionMilo
        ).to.be.undefined()
      })
    })

    describe('retourne les 3 prochains événements où le bénéficiaire n’est pas inscrit', () => {
      let evenementAVenir1: AsSql<RendezVousDto>
      let evenementAVenir2: AsSql<RendezVousDto>
      let evenementAVenir3: AsSql<RendezVousDto>
      let evenementPasse: AsSql<RendezVousDto>
      let evenementAVenirAutreAgence: AsSql<RendezVousDto>
      let evenementAVenirBeneficiaireDejaInscrit: AsSql<RendezVousDto>
      let evenementAVenir4HorsPage: AsSql<RendezVousDto>

      beforeEach(async () => {
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
        evenementAVenirBeneficiaireDejaInscrit = unRendezVousDto({
          date: maintenant.plus({ day: 2 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
        })
        evenementAVenir2 = unRendezVousDto({
          date: maintenant.plus({ day: 3 }).toJSDate(),
          type: CodeTypeRendezVous.ATELIER,
          idAgence: 'bonne-agence-id'
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
          evenementAVenirBeneficiaireDejaInscrit,
          evenementAVenir2,
          evenementAVenir3,
          evenementAVenir4HorsPage
        ])
        await RendezVousJeuneAssociationSqlModel.create({
          id: 1,
          idRendezVous: evenementAVenirBeneficiaireDejaInscrit.id,
          idJeune: accueilQuery.idJeune
        })
      })
      after(() => {
        RendezVousSqlModel.destroy({ truncate: true, cascade: true })
      })

      it('retourne les 3 prochains événements à venir où le bénéficiaire n’est pas inscrit', async () => {
        // When
        result = await handler.handle(accueilQuery)

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

    describe("retourne les 3 prochaines sessions Milo où le bénéficiaire n'est pas inscrit", () => {
      it('renseignée s’il y en a', async () => {
        const sessionAvecInscriptionAJPlus1 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 1 }).toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })
        const sessionSansInscriptionAJPlus2 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 2 }).toISODate()
        })
        const sessionSansInscriptionAJPlus3 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 3 }).toISODate()
        })
        const sessionSansInscriptionAJPlus4 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 4 }).toISODate()
        })
        const sessionSansInscriptionAJPlus5 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: maintenant.plus({ days: 5 }).toISODate()
        })
        sessionsQueryGetter.handle
          .withArgs(accueilQuery.idJeune, 'idDossier', token, {
            periode: {
              debut: maintenant,
              fin: DateTime.fromISO(datePlus30Jours)
            }
          })
          .resolves(
            success([
              sessionAvecInscriptionAJPlus1,
              sessionSansInscriptionAJPlus2,
              sessionSansInscriptionAJPlus3,
              sessionSansInscriptionAJPlus4,
              sessionSansInscriptionAJPlus5
            ])
          )

        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(
          isSuccess(result) && result.data.sessionsMiloAVenir
        ).to.deep.equal([
          sessionSansInscriptionAJPlus2,
          sessionSansInscriptionAJPlus3,
          sessionSansInscriptionAJPlus4
        ])
      })

      it('vide s’il n’y en a pas', async () => {
        // Given
        sessionsQueryGetter.handle
          .withArgs(accueilQuery.idJeune, 'idDossier', token, {
            periode: {
              debut: maintenant,
              fin: DateTime.fromISO(datePlus30Jours)
            }
          })
          .resolves(success([]))

        // When
        result = await handler.handle(accueilQuery)

        // Then
        expect(
          isSuccess(result) && result.data.sessionsMiloAVenir
        ).to.deep.equal([])
      })
    })

    it('appelle la accueilQuery pour récupérer les 3 dernières alertes (recherches sauvegardées)', async () => {
      // Given
      alertesQueryGetter.handle.resolves([])

      // When
      result = await handler.handle(accueilQuery)

      // Then
      expect(
        isSuccess(result) && alertesQueryGetter.handle
      ).to.have.been.calledWithExactly({ idJeune: accueilQuery.idJeune })
    })

    it('appelle la accueilQuery pour récupérer les 3 derniers favoris', async () => {
      // Given
      favorisAccueilQueryGetter.handle.resolves([])

      // When
      result = await handler.handle(accueilQuery)

      // Then
      expect(
        isSuccess(result) && favorisAccueilQueryGetter.handle
      ).to.have.been.calledWithExactly({ idJeune: accueilQuery.idJeune })
    })

    it('retourne la campagne rattachée', async () => {
      getCampagneQueryGetter.handle.resetHistory()
      // Given
      getCampagneQueryGetter.handle
        .withArgs({
          idJeune: accueilQuery.idJeune
        })
        .resolves(campagneQueryModel)

      // When
      result = await handler.handle(accueilQuery)

      // Then
      expect(
        isSuccess(result) && getCampagneQueryGetter.handle
      ).to.have.been.calledOnceWithExactly({ idJeune: accueilQuery.idJeune })
      expect(isSuccess(result) && result.data.campagne).to.deep.equal(
        campagneQueryModel
      )
    })
  })

  describe('authorize', () => {
    it('autorise un jeune MILO', () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const query = {
        idJeune: 'idJeune',
        maintenant: '2023-12-12',
        accessToken: 'token',
        structure: Core.Structure.MILO
      }

      // When
      handler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur,
        estMiloPassEmploi(utilisateur.structure)
      )
    })
  })
})
