import { describe } from 'mocha'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import {
  GetJeuneHomeAgendaPoleEmploiQuery,
  GetJeuneHomeAgendaPoleEmploiQueryHandler
} from '../../../src/application/queries/get-jeune-home-agenda-pole-emploi.query.handler'
import {
  failure,
  isSuccess,
  Result,
  success
} from '../../../src/building-blocks/types/result'
import { DateTime } from 'luxon'
import { JeuneHomeAgendaPoleEmploiQueryModel } from '../../../src/application/queries/query-models/home-jeune-suivi.query-model'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { Demarche } from '../../../src/domain/demarche'
import { Cached } from '../../../src/building-blocks/types/query'

describe('GetJeuneHomeAgendaPoleEmploiQueryHandler', () => {
  let handler: GetJeuneHomeAgendaPoleEmploiQueryHandler
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getRendezVousJeunePoleEmploiQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let keycloakClient: StubbedClass<KeycloakClient>
  const idpToken = 'id-token'

  beforeEach(() => {
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getRendezVousJeunePoleEmploiQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves(idpToken)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)

    handler = new GetJeuneHomeAgendaPoleEmploiQueryHandler(
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      jeunePoleEmploiAuthorizer,
      keycloakClient
    )
  })

  describe('handle', () => {
    const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
    const dansDeuxSemaines = DateTime.fromISO('2020-04-20T12:00:00.000Z')
    const uneDemarcheDeLaSemaineDerniere = uneDemarcheQueryModel({
      dateFin: maintenant.minus({ weeks: 1 }).toISO()
    })
    const uneDemarcheDeLaSemaine = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ day: 1 }).toISO()
    })
    const uneDemarcheDeLaSemaineProchaine = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ weeks: 1 }).toISO()
    })
    const uneDemarcheDansDeuxSemainesPlusUnJour = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ weeks: 2, day: 1 }).toISO()
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

    let result: Result<Cached<JeuneHomeAgendaPoleEmploiQueryModel>>

    describe('quand les services externes répondent avec Succès', () => {
      describe('mapping et filtres', () => {
        beforeEach(async () => {
          // Given
          const query: GetJeuneHomeAgendaPoleEmploiQuery = {
            idJeune: 'idJeune',
            maintenant: maintenant,
            accessToken: 'accessToken'
          }

          getDemarchesQueryGetter.handle
            .withArgs({
              ...query,
              tri: GetDemarchesQueryGetter.Tri.parDateFin,
              idpToken
            })
            .resolves(
              success({
                queryModel: [
                  uneDemarcheDansDeuxSemainesPlusUnJour,
                  uneDemarcheDeLaSemaine,
                  uneDemarcheDeLaSemaineProchaine,
                  uneDemarcheDeLaSemaineDerniere
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

          // When
          result = await handler.handle(query)
        })
        it('retourne des démarches filtrées entre maintenant et dans deux semaines', () => {
          // Then
          expect(
            isSuccess(result) && result.data.queryModel.demarches
          ).to.deep.equal([
            uneDemarcheDeLaSemaine,
            uneDemarcheDeLaSemaineProchaine
          ])
        })

        it('retourne des rendez vous filtrées entre maintenant et dans deux semaines', () => {
          // Then
          expect(
            isSuccess(result) && result.data.queryModel.rendezVous
          ).to.deep.equal([unRendezVousAujourdhui])
        })

        it('retourne des metadata', () => {
          // Then
          expect(
            isSuccess(result) && result.data.queryModel.metadata
          ).to.deep.equal({
            dateDeDebut: maintenant.toJSDate(),
            dateDeFin: dansDeuxSemaines.toJSDate(),
            demarchesEnRetard: 0
          })
        })
      })

      describe('demarches en retard', () => {
        describe('quand la démarche est en cours', () => {
          describe('quand la date de fin de la démarche est passée', () => {
            it('compte une démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.minus({ day: 1 }).toISO(),
                statut: Demarche.Statut.EN_COURS
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(1)
            })
          })
          describe('quand la date de fin de la démarche est future', () => {
            it('compte 0 démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.plus({ day: 1 }).toISO(),
                statut: Demarche.Statut.EN_COURS
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(0)
            })
          })
        })
        describe('quand la démarche est à faire', () => {
          describe('quand la date de fin de la démarche est passée', () => {
            it('compte une démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.minus({ day: 1 }).toISO(),
                statut: Demarche.Statut.A_FAIRE
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(1)
            })
          })
          describe('quand la date de fin de la démarche est future', () => {
            it('compte 0 démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.plus({ day: 1 }).toISO(),
                statut: Demarche.Statut.A_FAIRE
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(0)
            })
          })
        })
        describe('quand la démarche est réalisée', () => {
          describe('quand la date de fin de la démarche est passée', () => {
            it('compte 0 démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.minus({ day: 1 }).toISO(),
                statut: Demarche.Statut.REALISEE
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(0)
            })
          })
          describe('quand la date de fin de la démarche est future', () => {
            it('compte 0 démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.plus({ day: 1 }).toISO(),
                statut: Demarche.Statut.REALISEE
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(0)
            })
          })
        })
        describe('quand la démarche est annulée', () => {
          describe('quand la date de fin de la démarche est passée', () => {
            it('compte 0 démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.minus({ day: 1 }).toISO(),
                statut: Demarche.Statut.ANNULEE
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(0)
            })
          })
          describe('quand la date de fin de la démarche est future', () => {
            it('compte 0 démarche en retard', async () => {
              // Given
              const query: GetJeuneHomeAgendaPoleEmploiQuery = {
                idJeune: 'idJeune',
                maintenant: maintenant,
                accessToken: 'accessToken'
              }

              const demarche = uneDemarcheQueryModel({
                dateFin: maintenant.plus({ day: 1 }).toISO(),
                statut: Demarche.Statut.ANNULEE
              })

              getDemarchesQueryGetter.handle.resolves(
                success({ queryModel: [demarche] })
              )

              getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
                success({ queryModel: [] })
              )

              // When
              result = await handler.handle(query)

              // Then
              expect(
                isSuccess(result) &&
                  result.data.queryModel.metadata.demarchesEnRetard
              ).to.equal(0)
            })
          })
        })
      })
    })

    describe('quand les démarches sont en échec', () => {
      it("retourne l'échec", async () => {
        // Given
        const query: GetJeuneHomeAgendaPoleEmploiQuery = {
          idJeune: 'idJeune',
          maintenant: maintenant,
          accessToken: 'accessToken'
        }

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
        const query: GetJeuneHomeAgendaPoleEmploiQuery = {
          idJeune: 'idJeune',
          maintenant: maintenant,
          accessToken: 'accessToken'
        }

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
      const query: GetJeuneHomeAgendaPoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: DateTime.now(),
        accessToken: 'accessToken'
      }

      // When
      handler.authorize(query, unUtilisateurJeune())

      // Then
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly(query.idJeune, unUtilisateurJeune())
    })
  })
})
