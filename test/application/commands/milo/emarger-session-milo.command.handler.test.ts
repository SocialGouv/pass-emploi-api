import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import {
  ConseillerMiloSansStructure,
  EmargementIncorrect,
  ErreurHttp
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/milo/conseiller'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from 'test/utils'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { DateService } from 'src/utils/date-service'
import { uneSessionMilo } from '../../../fixtures/sessions.fixture'
import {
  EmargerSessionMiloCommand,
  EmargerSessionMiloCommandHandler
} from 'src/application/commands/milo/emarger-session-milo.command.handler'
import Utilisateur = Authentification.Utilisateur

describe('EmargerSessionMiloCommandHandler', () => {
  let emargementCommandHandler: EmargerSessionMiloCommandHandler
  let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
  let sessionMiloRepository: StubbedType<SessionMilo.Repository>
  let oidcClient: StubbedClass<OidcClient>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  const conseiller = unConseillerMilo()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    conseillerMiloRepository = stubInterface(sandbox)
    sessionMiloRepository = stubInterface(sandbox)
    oidcClient = stubClass(OidcClient)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    emargementCommandHandler = new EmargerSessionMiloCommandHandler(
      conseillerMiloRepository,
      sessionMiloRepository,
      oidcClient,
      dateService,
      conseillerAuthorizer
    )
  })

  describe('handle', () => {
    const commandSansEmargement: EmargerSessionMiloCommand = {
      idSession: 'idSession',
      idConseiller: conseiller.id,
      accessToken: 'token',
      emargements: []
    }

    it('n’autorise pas un conseiller sans structure', async () => {
      // Given
      const conseillerMiloSansStructure = new ConseillerMiloSansStructure(
        commandSansEmargement.idConseiller
      )
      conseillerMiloRepository.get
        .withArgs(commandSansEmargement.idConseiller)
        .resolves(failure(conseillerMiloSansStructure))

      // When
      const result = await emargementCommandHandler.handle(
        commandSansEmargement
      )

      // Then
      expect(result).to.deep.equal(failure(conseillerMiloSansStructure))
    })

    it('n’autorise pas un conseiller qui n’a pas accès à la session', async () => {
      // Given
      const idpToken = 'idpToken'
      conseillerMiloRepository.get
        .withArgs(commandSansEmargement.idConseiller)
        .resolves(success(conseiller))
      const erreurHttp = new ErreurHttp('', 404)
      oidcClient.exchangeTokenConseillerMilo
        .withArgs(commandSansEmargement.accessToken)
        .resolves(idpToken)
      sessionMiloRepository.getForConseiller
        .withArgs(
          commandSansEmargement.idSession,
          conseiller.structure,
          idpToken
        )
        .resolves(failure(erreurHttp))

      // When
      const result = await emargementCommandHandler.handle(
        commandSansEmargement
      )

      // Then
      expect(result).to.deep.equal(failure(erreurHttp))
    })

    describe('quand le conseiller a accès à la session', () => {
      const idpToken = 'idpToken'
      const commandAvecEmargements: EmargerSessionMiloCommand = {
        idSession: 'idSession',
        idConseiller: conseiller.id,
        accessToken: 'token',
        emargements: [
          {
            idJeune: 'id-hermione',
            statut: SessionMilo.Inscription.Statut.INSCRIT
          },
          {
            idJeune: 'id-ron',
            statut: SessionMilo.Inscription.Statut.PRESENT
          },
          {
            idJeune: 'id-harry',
            statut: SessionMilo.Inscription.Statut.REFUS_TIERS
          }
        ]
      }
      const uneDateDEmargement = uneDatetime()

      beforeEach(async () => {
        // Given
        conseillerMiloRepository.get
          .withArgs(commandSansEmargement.idConseiller)
          .resolves(success(conseiller))
        oidcClient.exchangeTokenConseillerMilo
          .withArgs(commandSansEmargement.accessToken)
          .resolves(idpToken)
        sessionMiloRepository.getForConseiller
          .withArgs(
            commandSansEmargement.idSession,
            conseiller.structure,
            idpToken
          )
          .resolves(success(uneSessionMilo()))
        dateService.now.returns(uneDateDEmargement)
      })

      it('renvoie une failure si tous les jeunes de la session ne sont pas emargés', async () => {
        // When
        const result = await emargementCommandHandler.handle(
          commandSansEmargement
        )

        // Then
        expect(result).to.deep.equal(failure(new EmargementIncorrect()))
      })

      it('renvoie une failure si l’enregistrement de la session a échoué', async () => {
        // Given
        const uneErreurHttp = new ErreurHttp('', 0)
        sessionMiloRepository.save.resolves(failure(uneErreurHttp))

        // When
        const result = await emargementCommandHandler.handle(
          commandAvecEmargements
        )

        // Then
        expect(result).to.deep.equal(failure(uneErreurHttp))
      })

      it('enregistre la session en modifiant l’inscription des jeunes présents et inscrits', async () => {
        // Given
        sessionMiloRepository.save.resolves(emptySuccess())

        // When
        const result = await emargementCommandHandler.handle(
          commandAvecEmargements
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          {
            ...uneSessionMilo(),
            dateModification: uneDateDEmargement,
            dateCloture: uneDateDEmargement
          },
          {
            idsJeunesAInscrire: [],
            inscriptionsASupprimer: [],
            inscriptionsAModifier: [
              {
                idJeune: 'id-hermione',
                idInscription: 'id-inscription-hermione',
                statut: SessionMilo.Inscription.Statut.REFUS_JEUNE,
                commentaire: 'Absent'
              },
              {
                idJeune: 'id-ron',
                idInscription: 'id-inscription-ron',
                statut: SessionMilo.Inscription.Statut.PRESENT,
                commentaire: undefined
              }
            ]
          },
          idpToken
        )
      })
    })
  })

  describe('authorize', () => {
    it('authorize le conseiller', async () => {
      // Given
      const command: EmargerSessionMiloCommand = {
        idSession: 'idSession',
        idConseiller: conseiller.id,
        accessToken: 'token',
        emargements: []
      }
      const utilisateur: Utilisateur = unUtilisateurConseiller()

      // When
      await emargementCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(command.idConseiller, utilisateur, true)
    })
  })
})
