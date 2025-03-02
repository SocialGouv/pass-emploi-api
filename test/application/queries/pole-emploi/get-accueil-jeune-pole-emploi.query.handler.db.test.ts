import { DateService } from 'src/utils/date-service'
import { GetDemarchesQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { AccueilJeunePoleEmploiQueryModel } from '../../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { DateTime } from 'luxon'
import {
  failure,
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'
import {
  GetAccueilJeunePoleEmploiQuery,
  GetAccueilJeunePoleEmploiQueryHandler
} from '../../../../src/application/queries/pole-emploi/get-accueil-jeune-pole-emploi.query.handler.db'
import { Demarche } from '../../../../src/domain/demarche'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { unRendezVousQueryModel } from '../../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { Core, estPoleEmploi } from '../../../../src/domain/core'
import Structure = Core.Structure
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import { uneDemarcheQueryModel } from '../../../fixtures/query-models/demarche.query-model.fixtures'
import { GetRecherchesSauvegardeesQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { Recherche } from '../../../../src/domain/offre/recherche/recherche'
import { GetFavorisAccueilQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { GetCampagneQueryGetter } from 'src/application/queries/query-getters/get-campagne.query.getter'
import { uneCampagneQueryModel } from 'test/fixtures/campagne.fixture'

describe('GetAccueilJeunePoleEmploiQueryHandler', () => {
  let handler: GetAccueilJeunePoleEmploiQueryHandler
  let getCampagneQueryGetter: StubbedClass<GetCampagneQueryGetter>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getRendezVousJeunePoleEmploiQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let getRecherchesSauvegardeesQueryGetter: StubbedClass<GetRecherchesSauvegardeesQueryGetter>
  let getFavorisQueryGetter: StubbedClass<GetFavorisAccueilQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let oidcClient: StubbedClass<OidcClient>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  const idpToken = 'id-token'
  const jeune = unJeune({ structure: Core.Structure.POLE_EMPLOI })

  beforeEach(() => {
    getCampagneQueryGetter = stubClass(GetCampagneQueryGetter)
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getRecherchesSauvegardeesQueryGetter = stubClass(
      GetRecherchesSauvegardeesQueryGetter
    )
    getFavorisQueryGetter = stubClass(GetFavorisAccueilQueryGetter)
    getRendezVousJeunePoleEmploiQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    jeuneRepository.get.resolves(jeune)
    oidcClient = stubClass(OidcClient)
    oidcClient.exchangeTokenJeune.resolves(idpToken)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)

    handler = new GetAccueilJeunePoleEmploiQueryHandler(
      jeuneRepository,
      jeuneAuthorizer,
      oidcClient,
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      getRecherchesSauvegardeesQueryGetter,
      getFavorisQueryGetter,
      getCampagneQueryGetter,
      dateService
    )
  })

  describe('handle', () => {
    const maintenantString = '2023-03-28T12:00:00.000Z'
    const maintenant = DateTime.fromISO(maintenantString)
    const query: GetAccueilJeunePoleEmploiQuery = {
      idJeune: 'idJeune',
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
      })
    })

    describe('quand les démarches et les rdv sont en échec', () => {
      it("retourne une page d'acceuil avec un message informatif", async () => {
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
            'Les données suivantes sont temporairement indisponibles : démarches, rendez-vous'
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
        accessToken: 'accessToken'
      }

      // When
      handler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur,
        estPoleEmploi(utilisateur.structure)
      )
    })
  })
})
