import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { DetailSessionConseillerMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo.db'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { PlanificateurService } from 'src/domain/planificateur'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { DateService } from 'src/utils/date-service'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerMiloQueryModel,
  uneSessionMilo
} from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'

describe('GetDetailSessionConseillerMiloQueryHandler', () => {
  const now = DateTime.local(2023)

  let getDetailSessionMiloQueryHandler: GetDetailSessionConseillerMiloQueryHandler
  let oidcClient: StubbedClass<OidcClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let sessionRepository: StubbedType<SessionMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  let planificateurService: StubbedClass<PlanificateurService>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()

    oidcClient = stubClass(OidcClient)
    conseillerRepository = stubInterface(sandbox)
    sessionRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    planificateurService = stubClass(PlanificateurService)

    dateService.now.returns(now)

    getDetailSessionMiloQueryHandler =
      new GetDetailSessionConseillerMiloQueryHandler(
        conseillerRepository,
        sessionRepository,
        conseillerAuthorizer,
        oidcClient,
        dateService,
        planificateurService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      // When
      const query = {
        idSession: 'idSession',
        idConseiller: 'idConseiller',
        accessToken: 'bearer un-token'
      }
      getDetailSessionMiloQueryHandler.authorize(
        query,
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller(),
        true
      )
    })
  })

  describe('handle', () => {
    const query = {
      idSession: 'idSession-1',
      idConseiller: 'idConseiller-1',
      accessToken: 'bearer un-token'
    }
    it("renvoie une failure quand le conseiller Milo n'existe pas", async () => {
      // Given
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(failure(new ConseillerMiloSansStructure(query.idConseiller)))

      // When
      const result = await getDetailSessionMiloQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new ConseillerMiloSansStructure(query.idConseiller))
      )
    })

    describe('récupère le détail d’une session', () => {
      const tokenMilo = 'token-milo'
      const sessionMilo = uneSessionMilo()

      let result: Result<DetailSessionConseillerMiloQueryModel>
      beforeEach(async () => {
        // Given
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(unConseillerMilo()))
        oidcClient.exchangeTokenConseillerMilo
          .withArgs(query.accessToken)
          .resolves(tokenMilo)

        sessionMilo.inscriptions = sessionMilo.inscriptions.filter(
          ({ statut }) => statut !== SessionMilo.Inscription.Statut.INSCRIT
        )
        sessionRepository.getForConseiller.resolves(success(sessionMilo))

        // When
        result = await getDetailSessionMiloQueryHandler.handle(query)
      })

      it('déclenche la cloture de la session', async () => {
        // Then
        expect(
          planificateurService.ajouterJobClotureSessions
        ).to.have.been.calledOnceWithExactly(
          [sessionMilo.id],
          sessionMilo.idStructureMilo,
          now,
          sandbox.match.object
        )
      })

      it('renvoie la session', async () => {
        // Then
        expect(
          sessionRepository.getForConseiller
        ).to.have.been.calledOnceWithExactly(
          query.idSession,
          {
            id: '1',
            timezone: 'America/Cayenne'
          },
          tokenMilo
        )
        expect(result).to.deep.equal(
          success({
            ...unDetailSessionConseillerMiloQueryModel,
            session: {
              ...unDetailSessionConseillerMiloQueryModel.session,
              statut: SessionMilo.Statut.CLOTUREE
            },
            inscriptions: [
              {
                idJeune: 'id-ron',
                nom: 'Weasley',
                prenom: 'Ronald',
                statut: SessionMilo.Inscription.Statut.REFUS_TIERS
              },
              {
                idJeune: 'id-harry',
                nom: 'Potter',
                prenom: 'Harry',
                statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
              }
            ]
          })
        )
      })
    })
  })
})
