import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { createSandbox, expect, StubbedClass, stubClass } from 'test/utils'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import { Authentification } from 'src/domain/authentification'
import Utilisateur = Authentification.Utilisateur
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { SinonSandbox } from 'sinon'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import {
  ConseillerMiloSansStructure,
  ErreurHttp,
  MaxInscritsDepasse
} from 'src/building-blocks/types/domain-error'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { KeycloakClient } from '../../../../src/infrastructure/clients/keycloak-client'
import { DateService } from '../../../../src/utils/date-service'
import { uneSessionMilo } from '../../../fixtures/sessions.fixture'

describe('UpdateSessionMiloCommandHandler', () => {
  let updateSessionMiloCommandHandler: UpdateSessionMiloCommandHandler
  let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
  let sessionMiloRepository: StubbedType<SessionMilo.Repository>
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  const conseiller = unConseillerMilo()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    conseillerMiloRepository = stubInterface(sandbox)
    sessionMiloRepository = stubInterface(sandbox)
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    updateSessionMiloCommandHandler = new UpdateSessionMiloCommandHandler(
      conseillerMiloRepository,
      sessionMiloRepository,
      miloClient,
      keycloakClient,
      dateService,
      conseillerAuthorizer
    )
  })

  describe('handle', () => {
    const command: UpdateSessionMiloCommand = {
      idSession: 'idSession',
      idConseiller: conseiller.id,
      token: 'token',
      estVisible: true,
      inscriptions: [
        {
          idJeune: 'id-hermione',
          statut: SessionMilo.Inscription.Statut.INSCRIT
        },
        {
          idJeune: 'id-ron',
          statut: SessionMilo.Inscription.Statut.INSCRIT
        },
        {
          idJeune: 'id-harry',
          statut: SessionMilo.Inscription.Statut.REFUS_TIERS
        }
      ]
    }

    it('n’autorise pas un conseiller sans structure', async () => {
      // Given
      const conseillerMiloSansStructure = new ConseillerMiloSansStructure(
        command.idConseiller
      )
      conseillerMiloRepository.get
        .withArgs(command.idConseiller)
        .resolves(failure(conseillerMiloSansStructure))

      // When
      const result = await updateSessionMiloCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(failure(conseillerMiloSansStructure))
    })

    it('n’autorise pas un conseiller qui n’a pas accès à la session', async () => {
      // Given
      const idpToken = 'idpToken'
      conseillerMiloRepository.get
        .withArgs(command.idConseiller)
        .resolves(success(conseiller))
      const erreurHttp = new ErreurHttp('', 404)
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(command.token)
        .resolves(idpToken)
      sessionMiloRepository.getForConseiller
        .withArgs(command.idSession, conseiller.structure, idpToken)
        .resolves(failure(erreurHttp))

      // When
      const result = await updateSessionMiloCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(failure(erreurHttp))
    })

    describe('quand le conseiller a accès à la session', () => {
      const idpToken = 'idpToken'
      beforeEach(async () => {
        // Given
        conseillerMiloRepository.get
          .withArgs(command.idConseiller)
          .resolves(success(conseiller))
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(command.token)
          .resolves(idpToken)
        dateService.now.returns(uneDatetime())
        sessionMiloRepository.save.resolves(emptySuccess())
      })

      it('met à jour une session si le conseiller y a accès', async () => {
        // Given
        const session = uneSessionMilo({ inscriptions: [] })
        sessionMiloRepository.getForConseiller.resolves(success(session))

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          { ...session, estVisible: true, dateModification: uneDatetime() },
          [
            {
              idJeune: 'id-hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            }
          ],
          idpToken
        )
        expect(result).to.deep.equal(emptySuccess())
      })

      it('ne met à jour une session qu’avec les nouveaux inscrits', async () => {
        // Given
        const session = uneSessionMilo({
          inscriptions: [
            {
              idJeune: 'id-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            }
          ]
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          { ...session, estVisible: true, dateModification: uneDatetime() },
          [
            {
              idJeune: 'id-ron',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            }
          ],
          idpToken
        )
        expect(result).to.deep.equal(emptySuccess())
      })

      it('empêche de dépasser le nombre maximum de participants', async () => {
        // Given
        const session = uneSessionMilo({
          nbPlacesDisponibles: 2,
          inscriptions: []
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(sessionMiloRepository.save).not.to.have.been.called()
        expect(result).to.deep.equal(failure(new MaxInscritsDepasse()))
      })
    })
  })

  describe('authorize', () => {
    it('authorize le conseiller', async () => {
      // Given
      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idSession: 'idSession',
        idConseiller: conseiller.id,
        token: 'token'
      }
      const utilisateur: Utilisateur = unUtilisateurConseiller()

      // When
      await updateSessionMiloCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(command.idConseiller, utilisateur, true)
    })
  })
})
