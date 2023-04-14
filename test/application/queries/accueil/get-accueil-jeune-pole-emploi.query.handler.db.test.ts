import { GetDemarchesQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { AccueilJeunePoleEmploiQueryModel } from '../../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
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
} from '../../../../src/application/queries/accueil/get-accueil-jeune-pole-emploi.query.handler.db'
import { Demarche } from '../../../../src/domain/demarche'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { unRendezVousQueryModel } from '../../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'
import { Core } from '../../../../src/domain/core'
import Structure = Core.Structure
import { JeunePoleEmploiAuthorizer } from '../../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { uneDemarcheQueryModel } from '../../../fixtures/query-models/demarche.query-model.fixtures'
import { GetRecherchesSauvegardeesQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { Recherche } from '../../../../src/domain/offre/recherche/recherche'
import { GetFavorisAccueilQueryGetter } from '../../../../src/application/queries/query-getters/accueil/get-favoris.query.getter.db'

describe('GetAccueilJeunePoleEmploiQueryHandler', () => {
  let handler: GetAccueilJeunePoleEmploiQueryHandler
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getRendezVousJeunePoleEmploiQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let getRecherchesSauvegardeesQueryGetter: StubbedClass<GetRecherchesSauvegardeesQueryGetter>
  let getFavorisQueryGetter: StubbedClass<GetFavorisAccueilQueryGetter>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let keycloakClient: StubbedClass<KeycloakClient>
  const idpToken = 'id-token'

  beforeEach(() => {
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getRecherchesSauvegardeesQueryGetter = stubClass(
      GetRecherchesSauvegardeesQueryGetter
    )
    getFavorisQueryGetter = stubClass(GetFavorisAccueilQueryGetter)
    getRendezVousJeunePoleEmploiQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves(idpToken)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)

    handler = new GetAccueilJeunePoleEmploiQueryHandler(
      jeunePoleEmploiAuthorizer,
      keycloakClient,
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      getRecherchesSauvegardeesQueryGetter,
      getFavorisQueryGetter
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

    let result: Result<AccueilJeunePoleEmploiQueryModel>

    describe('quand les services externes répondent avec Succès', () => {
      describe('mapping et filtres', () => {
        beforeEach(async () => {
          // Given
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
              idpToken
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
                criteres: undefined
              }
            ])

          getFavorisQueryGetter.handle
            .withArgs({
              idJeune: query.idJeune
            })
            .resolves([])

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
      })
    })

    describe('quand les démarches sont en échec', () => {
      it("retourne l'échec", async () => {
        // Given
        getDemarchesQueryGetter.handle.resolves(
          failure(new ErreurHttp('Erreur', 500))
        )

        // When
        result = await handler.handle(query)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('Erreur', 500)))
      })
    })

    describe('quand les rendez vous sont en échec', () => {
      it("retourne l'échec", async () => {
        // Given
        getDemarchesQueryGetter.handle.resolves(success({ queryModel: [] }))
        getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
          failure(new ErreurHttp('Erreur', 418))
        )

        // When
        result = await handler.handle(query)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('Erreur', 418)))
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune PE', () => {
      // Given
      const query: GetAccueilJeunePoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: '2023-03-30T15:00:00Z',
        accessToken: 'accessToken'
      }

      // When
      handler.authorize(
        query,
        unUtilisateurJeune({ structure: Structure.POLE_EMPLOI })
      )

      // Then
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly(
        query.idJeune,
        unUtilisateurJeune({ structure: Structure.POLE_EMPLOI })
      )
    })
  })
})
