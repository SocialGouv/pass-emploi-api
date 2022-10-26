import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import {
  GetJeuneHomeAgendaPoleEmploiQuery,
  GetJeuneHomeAgendaPoleEmploiQueryHandler
} from '../../../src/application/queries/get-jeune-home-agenda-pole-emploi.query.handler'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('GetJeuneHomeAgendaPoleEmploiQueryHandler', () => {
  let handler: GetJeuneHomeAgendaPoleEmploiQueryHandler

  let sandbox: SinonSandbox
  let jeunesRepository: StubbedType<Jeune.Repository>
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
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>

  beforeEach(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    jeunesRepository.get.resolves(unJeune())
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    poleEmploiPartenaireClient.getDemarches.resolves([])

    const axiosResponse = {
      config: undefined,
      headers: undefined,
      request: undefined,
      status: 200,
      statusText: '',
      data: {}
    }
    poleEmploiPartenaireClient.getPrestations.resolves({
      ...axiosResponse,
      data: []
    })
    poleEmploiPartenaireClient.getRendezVous.resolves({
      ...axiosResponse,
      data: []
    })

    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)

    idService = stubClass(IdService)
    idService.uuid.returns('random-id')

    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves(idpToken)

    getDemarchesQueryGetter = new GetDemarchesQueryGetter(
      jeunesRepository,
      poleEmploiPartenaireClient,
      dateService,
      keycloakClient
    )

    getRendezVousJeunePoleEmploiQueryGetter =
      new GetRendezVousJeunePoleEmploiQueryGetter(
        jeunesRepository,
        poleEmploiPartenaireClient,
        dateService,
        idService,
        keycloakClient
      )

    handler = new GetJeuneHomeAgendaPoleEmploiQueryHandler(
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      jeunePoleEmploiAuthorizer,
      keycloakClient
    )
  })

  describe('handle', () => {
    // Appeler 2 fois la récupération de token en parallèle avec le même refresh token engendre des exceptions coté PE.
    // Le 2ème appel tombe en erreur car le token est déjà consommé.
    it('récupère le token uniquement 1 fois pour les 2 appels à pole-emploi', async () => {
      // Given
      const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
      const query: GetJeuneHomeAgendaPoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: maintenant,
        accessToken: 'accessToken'
      }

      // When
      await handler.handle(query)

      // Then
      expect(keycloakClient.exchangeTokenPoleEmploiJeune).to.have.callCount(1)
    })
  })
})
