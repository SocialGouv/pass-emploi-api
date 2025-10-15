import { DateTime } from 'luxon'
import { GetCampagneQueryGetter } from 'src/application/queries/query-getters/get-campagne.query.getter.db'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { DateService } from 'src/utils/date-service'
import { uneCampagneQueryModel } from 'test/fixtures/campagne.fixture'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import {
  GetAccueilJeunePoleEmploiQuery,
  GetAccueilJeunePoleEmploiQueryHandler
} from '../../../../src/application/queries/pole-emploi/get-accueil-jeune-pole-emploi.query.handler.db'
import { GetFavorisAccueilQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { GetDemarchesQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { AccueilJeunePoleEmploiQueryModel } from '../../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import {
  failure,
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'
import { Core, estFranceTravail } from '../../../../src/domain/core'
import { Demarche } from '../../../../src/domain/demarche'
import { Recherche } from '../../../../src/domain/offre/recherche/recherche'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { uneDemarcheQueryModel } from '../../../fixtures/query-models/demarche.query-model.fixtures'
import { unRendezVousQueryModel } from '../../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { ConfigService } from '@nestjs/config'
import { FeatureFlipTag } from '../../../../src/infrastructure/sequelize/models/feature-flip.sql-model'
import { GetFeaturesQueryGetter } from '../../../../src/application/queries/query-getters/get-features.query.getter.db'
import Structure = Core.Structure
import { SinonMatcher } from 'sinon'

describe('GetAccueilJeunePoleEmploiQueryHandler', () => {
  let handler: GetAccueilJeunePoleEmploiQueryHandler
  let getCampagneQueryGetter: StubbedClass<GetCampagneQueryGetter>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getRendezVousJeunePoleEmploiQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let getRecherchesSauvegardeesQueryGetter: StubbedClass<GetRecherchesSauvegardeesQueryGetter>
  let getFavorisQueryGetter: StubbedClass<GetFavorisAccueilQueryGetter>
  let getFeaturesQueryGetter: StubbedClass<GetFeaturesQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let oidcClient: StubbedClass<OidcClient>
  let dateService: StubbedClass<DateService>
  let configService: StubbedClass<ConfigService>
  const idpToken = 'id-token'

  beforeEach(() => {
    getCampagneQueryGetter = stubClass(GetCampagneQueryGetter)
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getRecherchesSauvegardeesQueryGetter = stubClass(
      GetRecherchesSauvegardeesQueryGetter
    )
    getFavorisQueryGetter = stubClass(GetFavorisAccueilQueryGetter)
    getFeaturesQueryGetter = stubClass(GetFeaturesQueryGetter)
    getRendezVousJeunePoleEmploiQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )

    oidcClient = stubClass(OidcClient)
    oidcClient.exchangeTokenJeune.resolves(idpToken)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    configService = stubClass(ConfigService)

    handler = new GetAccueilJeunePoleEmploiQueryHandler(
      jeuneAuthorizer,
      oidcClient,
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      getRecherchesSauvegardeesQueryGetter,
      getFavorisQueryGetter,
      getCampagneQueryGetter,
      getFeaturesQueryGetter,
      dateService,
      configService
    )
  })

  describe('handle', () => {
    const maintenantString = '2023-03-28T12:00:00.000Z'
    const maintenant = DateTime.fromISO(maintenantString)
    const query: GetAccueilJeunePoleEmploiQuery = {
      idJeune: 'idJeune',
      structure: Structure.POLE_EMPLOI,
      maintenant: maintenantString,
      accessToken: 'accessToken'
    }

    const demarcheEnCoursEnRetard = uneDemarcheQueryModel({
      dateFin: maintenant.minus({ day: 1 }).toISO(),
      statut: Demarche.Statut.EN_COURS
    })
    const demarcheEnCoursPasEnRetard = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ day: 1 }).toISO(),
      statut: Demarche.Statut.EN_COURS
    })
    const demarcheAFaireEnRetard = uneDemarcheQueryModel({
      dateFin: maintenant.minus({ day: 1 }).toISO(),
      statut: Demarche.Statut.A_FAIRE
    })
    const demarcheAFairePasEnRetard = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ day: 1 }).toISO(),
      statut: Demarche.Statut.A_FAIRE
    })
    const demarcheRealisee = uneDemarcheQueryModel({
      dateFin: maintenant.minus({ day: 1 }).toISO(),
      statut: Demarche.Statut.REALISEE
    })
    const demarcheAnnulee = uneDemarcheQueryModel({
      dateFin: maintenant.minus({ day: 1 }).toISO(),
      statut: Demarche.Statut.ANNULEE
    })

    const unRendezVousHier = unRendezVousQueryModel({
      date: maintenant.minus({ day: 1 }).toJSDate()
    })
    const unRendezVousAujourdhui = unRendezVousQueryModel({
      date: maintenant.toJSDate()
    })
    const unRendezVousDansDeuxSemainesPlusUnJour = unRendezVousQueryModel({
      date: maintenant.plus({ weeks: 2, day: 1 }).toJSDate()
    })

    const recherche = {
      id: 'dd2651d1-1ec0-4588-a3d3-26cf4e313e1a',
      type: Recherche.Type.OFFRES_ALTERNANCE,
      metier: 'Boulanger',
      titre: 'Boulanger en alternance',
      localisation: 'Paris',
      dateCreation: '2023-01-22T10:00:00.000Z',
      dateDerniereRecherche: '2023-01-22T10:00:00.000Z',
      idJeune: 'idJeune',
      etat: Recherche.Etat.SUCCES
    }

    const campagneQueryModel = uneCampagneQueryModel()

    let result: Result<AccueilJeunePoleEmploiQueryModel>

    describe('quand les services externes répondent avec Succès', () => {
      describe('mapping et filtres', () => {
        beforeEach(async () => {
          // Given
          dateService.now.returns(maintenant)

          getDemarchesQueryGetter.handle
            .withArgs({
              ...query,
              tri: GetDemarchesQueryGetter.Tri.parDateFin,
              idpToken
            })
            .resolves(
              success({
                queryModel: [
                  demarcheEnCoursEnRetard,
                  demarcheEnCoursPasEnRetard,
                  demarcheAFaireEnRetard,
                  demarcheAFairePasEnRetard,
                  demarcheRealisee,
                  demarcheAnnulee
                ]
              })
            )

          getRendezVousJeunePoleEmploiQueryGetter.handle
            .withArgs({
              ...query,
              idpToken,
              dateDebut: maintenant
            })
            .resolves(
              success({
                queryModel: [
                  unRendezVousHier,
                  unRendezVousAujourdhui,
                  unRendezVousDansDeuxSemainesPlusUnJour
                ]
              })
            )

          getRecherchesSauvegardeesQueryGetter.handle
            .withArgs({
              idJeune: query.idJeune
            })
            .resolves([
              {
                ...recherche,
                geometrie: undefined,
                criteres: {}
              }
            ])

          getFavorisQueryGetter.handle
            .withArgs({
              idJeune: query.idJeune
            })
            .resolves([])

          getCampagneQueryGetter.handle
            .withArgs({
              idJeune: query.idJeune
            })
            .resolves(campagneQueryModel)

          getFeaturesQueryGetter.handle
            .withArgs({
              idJeune: query.idJeune,
              featureTag: FeatureFlipTag.MIGRATION
            })
            .resolves(true)

          configService.get
            .withArgs('features.dateDeMigration' as unknown as SinonMatcher)
            .returns('2024-09-01T00:00:00.000Z')

          // When
          result = await handler.handle(query)
        })
        it('retourne le prochain rendez-vous', () => {
          // Then
          expect(
            isSuccess(result) && result.data.prochainRendezVous
          ).to.deep.equal(unRendezVousAujourdhui)
        })
        it('compte les rendez-vous du reste de la semaine', async () => {
          // Then
          expect(
            isSuccess(result) && result.data.cetteSemaine.nombreRendezVous
          ).to.deep.equal(1)
        })
        it('compte les démarches à réaliser et en retard du reste de la semaine', async () => {
          // Then
          expect(
            isSuccess(result) &&
              result.data.cetteSemaine.nombreActionsDemarchesEnRetard
          ).to.deep.equal(2)
          expect(
            isSuccess(result) &&
              result.data.cetteSemaine.nombreActionsDemarchesARealiser
          ).to.deep.equal(2)
          expect(
            isSuccess(result) &&
              result.data.cetteSemaine
                .nombreActionsDemarchesAFaireSemaineCalendaire
          ).to.deep.equal(4)
        })
        it('appelle la query pour récupérer les 3 dernières alertes', async () => {
          // Then
          expect(
            isSuccess(result) && getRecherchesSauvegardeesQueryGetter.handle
          ).to.have.been.calledOnceWithExactly({ idJeune: query.idJeune })
        })
        it('appelle la query pour récupérer les 3 derniers favoris', async () => {
          // Then
          expect(
            isSuccess(result) && getFavorisQueryGetter.handle
          ).to.have.been.calledOnceWithExactly({ idJeune: query.idJeune })
        })
        it('récupère la campagne rattachée', async () => {
          // Then
          expect(
            isSuccess(result) && getCampagneQueryGetter.handle
          ).to.have.been.calledOnceWithExactly({ idJeune: query.idJeune })
          expect(isSuccess(result) && result.data.campagne).to.deep.equal(
            campagneQueryModel
          )
        })
        it('renvoie la date de migration quand le jeune fait partie de la feature MIGRATION et que la config contient une date', async () => {
          // Then
          expect(isSuccess(result) && result.data.dateDeMigration).to.equal(
            '2024-09-01T00:00:00.000Z'
          )
        })
      })
    })

    describe('quand les démarches et les rdv sont en échec', () => {
      it("retourne une page d'accueil avec un message informatif", async () => {
        // Given
        getDemarchesQueryGetter.handle.resolves(
          failure(new ErreurHttp('Erreur', 500))
        )

        dateService.now.returns(maintenant)
        getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
          failure(new ErreurHttp('Erreur', 418))
        )

        getRecherchesSauvegardeesQueryGetter.handle
          .withArgs({
            idJeune: query.idJeune
          })
          .resolves([
            {
              ...recherche,
              geometrie: undefined,
              criteres: {}
            }
          ])

        getFavorisQueryGetter.handle
          .withArgs({
            idJeune: query.idJeune
          })
          .resolves([])

        getCampagneQueryGetter.handle
          .withArgs({
            idJeune: query.idJeune
          })
          .resolves(campagneQueryModel)

        // When
        result = await handler.handle(query)

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(
            result.data.cetteSemaine
              .nombreActionsDemarchesAFaireSemaineCalendaire
          ).to.equal(0)
          expect(
            result.data.cetteSemaine.nombreActionsDemarchesARealiser
          ).to.equal(0)
          expect(
            result.data.cetteSemaine.nombreActionsDemarchesEnRetard
          ).to.equal(0)
          expect(result.data.cetteSemaine.nombreRendezVous).to.equal(0)
          expect(result.data.messageDonneesManquantes).to.equal(
            'Oups ! Ces données sont temporairement indisponibles (Rendez-vous, Démarches). Nous vous invitons à réessayer plus tard.'
          )
        }
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune PE', () => {
      // Given
      const utilisateur = unUtilisateurJeune({
        structure: Structure.POLE_EMPLOI
      })
      const query: GetAccueilJeunePoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: '2023-03-30T15:00:00Z',
        accessToken: 'accessToken',
        structure: Structure.POLE_EMPLOI
      }

      // When
      handler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur,
        estFranceTravail(utilisateur.structure)
      )
    })
  })
})
