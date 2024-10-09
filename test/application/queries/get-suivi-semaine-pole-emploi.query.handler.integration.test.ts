import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { Authentification } from 'src/domain/authentification'
import { Jeune } from 'src/domain/jeune/jeune'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  GetSuiviSemainePoleEmploiQuery,
  GetSuiviSemainePoleEmploiQueryHandler
} from '../../../src/application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { expect, StubbedClass, stubClass } from '../../utils'
import { success } from '../../../src/building-blocks/types/result'

describe('GetSuiviCetteSemainePoleEmploiQueryHandler', () => {
  let handler: GetSuiviSemainePoleEmploiQueryHandler

  let sandbox: SinonSandbox
  let jeunesRepository: StubbedType<Jeune.Repository>
  let authRepository: StubbedType<Authentification.Repository>
  let dateService: StubbedClass<DateService>
  let idService: StubbedClass<IdService>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let getDemarchesQueryGetter: GetDemarchesQueryGetter
  let keycloakClient: StubbedClass<KeycloakClient>
  const idpToken = 'idpToken'
  const maintenant = DateTime.fromISO('2022-05-09T10:11:00+02:00', {
    setZone: true
  })

  let getRendezVousJeunePoleEmploiQueryGetter: GetRendezVousJeunePoleEmploiQueryGetter
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    jeunesRepository.get.resolves(unJeune())
    authRepository = stubInterface(sandbox)
    authRepository.getJeuneById.resolves(unUtilisateurJeune())
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    poleEmploiPartenaireClient.getDemarches.resolves(success([]))

    poleEmploiPartenaireClient.getPrestations.resolves(success([]))
    poleEmploiPartenaireClient.getRendezVous.resolves(success([]))

    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)

    idService = stubClass(IdService)
    idService.uuid.returns('random-id')

    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenJeune.resolves(idpToken)

    getDemarchesQueryGetter = new GetDemarchesQueryGetter(
      authRepository,
      poleEmploiPartenaireClient,
      dateService,
      keycloakClient
    )

    getRendezVousJeunePoleEmploiQueryGetter =
      new GetRendezVousJeunePoleEmploiQueryGetter(
        jeunesRepository,
        poleEmploiPartenaireClient,
        idService,
        keycloakClient
      )

    handler = new GetSuiviSemainePoleEmploiQueryHandler(
      jeunesRepository,
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      jeuneAuthorizer,
      keycloakClient,
      dateService
    )
  })

  describe('handle', () => {
    // Appeler 2 fois la récupération de token en parallèle avec le même refresh token engendre des exceptions coté PE.
    // Le 2ème appel tombe en erreur car le token est déjà consommé.
    it('récupère le token uniquement 1 fois pour les 2 appels à pole-emploi', async () => {
      // Given
      const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
      const query: GetSuiviSemainePoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: maintenant,
        accessToken: 'accessToken'
      }

      // When
      await handler.handle(query)

      // Then
      expect(keycloakClient.exchangeTokenJeune).to.have.callCount(1)
    })
  })
})
