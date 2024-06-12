import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  GetSuiviSemainePoleEmploiQuery,
  GetSuiviSemainePoleEmploiQueryHandler
} from '../../../src/application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { SuiviSemainePoleEmploiQueryModel } from '../../../src/application/queries/query-models/home-jeune-suivi.query-model'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { Cached } from '../../../src/building-blocks/types/query'
import {
  failure,
  isSuccess,
  Result,
  success
} from '../../../src/building-blocks/types/result'
import { estPoleEmploiBRSA } from '../../../src/domain/core'
import { Demarche } from '../../../src/domain/demarche'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetSuiviSemainePoleEmploiQueryHandler', () => {
  let handler: GetSuiviSemainePoleEmploiQueryHandler
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getRendezVousJeunePoleEmploiQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let keycloakClient: StubbedClass<KeycloakClient>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let dateService: StubbedClass<DateService>
  const idpToken = 'id-token'
  const jeune = unJeune()
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')

  beforeEach(() => {
    const sandbox = createSandbox()
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getRendezVousJeunePoleEmploiQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    jeuneRepository = stubInterface(sandbox)
    jeuneRepository.get.resolves(jeune)
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenJeune.resolves(idpToken)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)

    handler = new GetSuiviSemainePoleEmploiQueryHandler(
      jeuneRepository,
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      jeuneAuthorizer,
      keycloakClient,
      dateService
    )
  })

  describe('handle', () => {
    const lundiPasse = maintenant.startOf('week')
    const dimancheEnHuit = maintenant.endOf('week').plus({ week: 1 })

    const uneDemarcheUnJourAvantLundiPasse = uneDemarcheQueryModel({
      dateFin: lundiPasse.minus({ day: 1 }).toISO()
    })
    const uneDemarcheLundiPasse = uneDemarcheQueryModel({
      dateFin: lundiPasse.toISO()
    })
    const uneDemarcheDimancheEnHuit = uneDemarcheQueryModel({
      dateFin: dimancheEnHuit.toISO()
    })
    const uneDemarcheUnJourApresDimancheEnHuit = uneDemarcheQueryModel({
      dateFin: dimancheEnHuit.plus({ day: 1 }).toISO()
    })

    const unRendezVousDeUnJourAvantLundiPasse = unRendezVousQueryModel({
      date: lundiPasse.minus({ day: 1 }).toJSDate()
    })
    const unRendezVousDeLundiPasse = unRendezVousQueryModel({
      date: lundiPasse.toJSDate()
    })
    const unRendezVousDeDimancheEnHuit = unRendezVousQueryModel({
      date: dimancheEnHuit.toJSDate()
    })
    const unRendezVousDeUnJourApresDimancheEnHuit = unRendezVousQueryModel({
      date: dimancheEnHuit.plus({ day: 1 }).toJSDate()
    })

    let result: Result<Cached<SuiviSemainePoleEmploiQueryModel>>

    describe('quand les services externes répondent avec Succès', () => {
      describe('mapping et filtres', () => {
        beforeEach(async () => {
          // Given
          const query: GetSuiviSemainePoleEmploiQuery = {
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
                  uneDemarcheUnJourApresDimancheEnHuit,
                  uneDemarcheLundiPasse,
                  uneDemarcheDimancheEnHuit,
                  uneDemarcheUnJourAvantLundiPasse
                ]
              })
            )

          getRendezVousJeunePoleEmploiQueryGetter.handle
            .withArgs({
              ...query,
              idpToken,
              dateFin: maintenant
            })
            .resolves(
              success({
                queryModel: [
                  unRendezVousDeUnJourAvantLundiPasse,
                  unRendezVousDeLundiPasse,
                  unRendezVousDeDimancheEnHuit,
                  unRendezVousDeUnJourApresDimancheEnHuit
                ]
              })
            )

          // When
          result = await handler.handle(query)
        })

        it('retourne des démarches filtrées entre lundi passé et dimanche en huit', () => {
          // Then
          expect(
            isSuccess(result) && result.data.queryModel.demarches
          ).to.deep.equal([uneDemarcheLundiPasse, uneDemarcheDimancheEnHuit])
        })

        it('retourne des rendez vous filtrées entre lundi passé et dimanche en huit', () => {
          // Then
          expect(
            isSuccess(result) && result.data.queryModel.rendezVous
          ).to.deep.equal([
            unRendezVousDeLundiPasse,
            unRendezVousDeDimancheEnHuit
          ])
        })

        it('retourne des metadata', () => {
          // Then
          expect(
            isSuccess(result) && result.data.queryModel.metadata
          ).to.deep.equal({
            dateDeDebut: lundiPasse.toJSDate(),
            dateDeFin: dimancheEnHuit.toJSDate(),
            demarchesEnRetard: 0
          })
        })
      })

      describe('demarches en retard', () => {
        describe('quand la démarche est en cours', () => {
          describe('quand la date de fin de la démarche est passée', () => {
            it('compte une démarche en retard', async () => {
              // Given
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
              const query: GetSuiviSemainePoleEmploiQuery = {
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
        const query: GetSuiviSemainePoleEmploiQuery = {
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
        const query: GetSuiviSemainePoleEmploiQuery = {
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
      const utilisateur = unUtilisateurJeune()
      const query: GetSuiviSemainePoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: DateTime.now(),
        accessToken: 'accessToken'
      }

      // When
      handler.authorize(query, unUtilisateurJeune())

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        query.idJeune,
        utilisateur,
        estPoleEmploiBRSA(utilisateur.structure)
      )
    })
  })
})
