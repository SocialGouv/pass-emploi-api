import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo.db'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerMiloQueryModel,
  uneSessionMilo
} from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { DateService } from 'src/utils/date-service'
import { DateTime } from 'luxon'

describe('GetDetailSessionConseillerMiloQueryHandler', () => {
  let getDetailSessionMiloQueryHandler: GetDetailSessionConseillerMiloQueryHandler
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let sessionRepository: StubbedType<SessionMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()

    keycloakClient = stubClass(KeycloakClient)
    conseillerRepository = stubInterface(sandbox)
    sessionRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    dateService.now.returns(DateTime.local(2023))
    getDetailSessionMiloQueryHandler =
      new GetDetailSessionConseillerMiloQueryHandler(
        conseillerRepository,
        sessionRepository,
        conseillerAuthorizer,
        keycloakClient,
        dateService
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

      beforeEach(() => {
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(unConseillerMilo()))
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.accessToken)
          .resolves(tokenMilo)
      })

      it('avec toutes ses informations', async () => {
        // Given
        sessionRepository.getForConseiller.resolves(success(uneSessionMilo()))

        // When
        const result = await getDetailSessionMiloQueryHandler.handle(query)

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
            inscriptions: [
              {
                idJeune: 'id-hermione',
                nom: 'Granger',
                prenom: 'Hermione',
                statut: SessionMilo.Inscription.Statut.INSCRIT
              },
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

      describe('et lui affecte le statut ', () => {
        it('CLOTUREE si elle a une de date de clôture', async () => {
          // Given
          const maintenant = DateTime.local(2023)
          sessionRepository.getForConseiller.resolves(
            success({
              ...uneSessionMilo(),
              dateCloture: maintenant.minus({ hours: 1 })
            })
          )

          // When
          const result = await getDetailSessionMiloQueryHandler.handle(query)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data.session.statut).to.deep.equal(
              SessionMilo.Statut.CLOTUREE
            )
          }
        })

        it('A_VENIR si elle n’est pas encore passée et qu’elle n’a pas de date de clôture', async () => {
          // Given
          const maintenant = DateTime.local(2023)
          sessionRepository.getForConseiller.resolves(
            success({
              ...uneSessionMilo(),
              fin: maintenant.plus({ days: 1 }),
              dateCloture: undefined
            })
          )

          // When
          const result = await getDetailSessionMiloQueryHandler.handle(query)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data.session.statut).to.deep.equal(
              SessionMilo.Statut.A_VENIR
            )
          }
        })

        it('A_CLOTURER si elle est passée et qu’elle n’a pas de date de clôture', async () => {
          // Given
          const maintenant = DateTime.local(2023)
          sessionRepository.getForConseiller.resolves(
            success({
              ...uneSessionMilo(),
              fin: maintenant.minus({ days: 1 }),
              dateCloture: undefined
            })
          )

          // When
          const result = await getDetailSessionMiloQueryHandler.handle(query)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data.session.statut).to.deep.equal(
              SessionMilo.Statut.A_CLOTURER
            )
          }
        })
      })
    })
  })
})
