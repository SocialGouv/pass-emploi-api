import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import {
  ConseillerMiloSansStructure,
  ErreurHttp,
  MaxInscritsDepasse
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from 'test/utils'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { DateService } from 'src/utils/date-service'
import { uneSessionMilo } from '../../../fixtures/sessions.fixture'
import Utilisateur = Authentification.Utilisateur
import { Notification } from '../../../../src/domain/notification/notification'
import { stubClassSandbox } from '../../../utils/types'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { uneConfiguration, unJeune } from '../../../fixtures/jeune.fixture'

describe('UpdateSessionMiloCommandHandler', () => {
  let updateSessionMiloCommandHandler: UpdateSessionMiloCommandHandler
  let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let sessionMiloRepository: StubbedType<SessionMilo.Repository>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  let notificationService: StubbedClass<Notification.Service>

  const conseiller = unConseillerMilo()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    conseillerMiloRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    sessionMiloRepository = stubInterface(sandbox)
    keycloakClient = stubClass(KeycloakClient)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    notificationService = stubClassSandbox(Notification.Service, sandbox)
    notificationService.notifierInscriptionSession.resolves()
    updateSessionMiloCommandHandler = new UpdateSessionMiloCommandHandler(
      conseillerMiloRepository,
      sessionMiloRepository,
      jeuneRepository,
      keycloakClient,
      dateService,
      conseillerAuthorizer,
      notificationService
    )
  })

  describe('handle', () => {
    const commandSansInscription: UpdateSessionMiloCommand = {
      idSession: 'idSession',
      idConseiller: conseiller.id,
      accessToken: 'token',
      estVisible: true
    }

    it('n’autorise pas un conseiller sans structure', async () => {
      // Given
      const conseillerMiloSansStructure = new ConseillerMiloSansStructure(
        commandSansInscription.idConseiller
      )
      conseillerMiloRepository.get
        .withArgs(commandSansInscription.idConseiller)
        .resolves(failure(conseillerMiloSansStructure))

      // When
      const result = await updateSessionMiloCommandHandler.handle(
        commandSansInscription
      )

      // Then
      expect(result).to.deep.equal(failure(conseillerMiloSansStructure))
    })

    it('n’autorise pas un conseiller qui n’a pas accès à la session', async () => {
      // Given
      const idpToken = 'idpToken'
      conseillerMiloRepository.get
        .withArgs(commandSansInscription.idConseiller)
        .resolves(success(conseiller))
      const erreurHttp = new ErreurHttp('', 404)
      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(commandSansInscription.accessToken)
        .resolves(idpToken)
      sessionMiloRepository.getForConseiller
        .withArgs(
          commandSansInscription.idSession,
          conseiller.structure,
          idpToken
        )
        .resolves(failure(erreurHttp))

      // When
      const result = await updateSessionMiloCommandHandler.handle(
        commandSansInscription
      )

      // Then
      expect(result).to.deep.equal(failure(erreurHttp))
    })

    describe('quand le conseiller a accès à la session', () => {
      const idpToken = 'idpToken'
      beforeEach(async () => {
        // Given
        conseillerMiloRepository.get
          .withArgs(commandSansInscription.idConseiller)
          .resolves(success(conseiller))
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(commandSansInscription.accessToken)
          .resolves(idpToken)
        dateService.now.returns(uneDatetime())
        sessionMiloRepository.save.resolves(emptySuccess())
      })

      it('la met à jour', async () => {
        // Given
        const session = uneSessionMilo({
          inscriptions: [],
          nbPlacesDisponibles: 3
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))

        // When
        const result = await updateSessionMiloCommandHandler.handle(
          commandSansInscription
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          {
            ...supprimerInscriptions(session),
            estVisible: true,
            dateModification: uneDatetime()
          },
          {
            idsJeunesAInscrire: [],
            inscriptionsASupprimer: [],
            inscriptionsAModifier: []
          },
          idpToken
        )
      })

      it('permet d’inscrire des jeunes à la session', async () => {
        // Given
        const session = uneSessionMilo({
          inscriptions: [
            {
              idJeune: 'id-hermione',
              idInscription: 'id-inscription-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            }
          ]
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))
        const command = {
          ...commandSansInscription,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            },
            {
              idJeune: 'id-harry',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            }
          ]
        }
        const unJeuneANotifier = unJeune({
          id: 'jeune-1',
          configuration: uneConfiguration({ idJeune: 'id-harry' })
        })

        jeuneRepository.findAll
          .withArgs(['id-harry'])
          .resolves([unJeuneANotifier])

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          {
            ...supprimerInscriptions(session),
            estVisible: true,
            dateModification: uneDatetime()
          },
          {
            idsJeunesAInscrire: ['id-harry'],
            inscriptionsASupprimer: [],
            inscriptionsAModifier: []
          },
          idpToken
        )
        expect(
          notificationService.notifierInscriptionSession
        ).to.have.been.calledOnceWithExactly(session.id, [unJeuneANotifier])
      })

      it('permet de désinscrire des jeunes de la session', async () => {
        // Given
        const session = uneSessionMilo({
          inscriptions: [
            {
              idJeune: 'id-hermione',
              idInscription: 'id-inscription-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
            }
          ]
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))
        const command = {
          ...commandSansInscription,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              statut: SessionMilo.Modification.StatutInscription.DESINSCRIT
            },
            {
              idJeune: 'id-harry',
              statut: SessionMilo.Modification.StatutInscription.DESINSCRIT
            }
          ]
        }

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          {
            ...supprimerInscriptions(session),
            estVisible: true,
            dateModification: uneDatetime()
          },
          {
            idsJeunesAInscrire: [],
            inscriptionsASupprimer: [
              {
                idJeune: 'id-hermione',
                idInscription: 'id-inscription-hermione'
              }
            ],
            inscriptionsAModifier: []
          },
          idpToken
        )
      })

      it('permet de modifier l’inscription des jeunes à la session', async () => {
        // Given
        const session = uneSessionMilo({
          inscriptions: [
            {
              idJeune: 'id-hermione',
              idInscription: 'id-inscription-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              idInscription: 'id-inscription-ron',
              nom: 'Weasley',
              prenom: 'Ronald',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            },
            {
              idJeune: 'id-ginny',
              idInscription: 'id-inscription-ginny',
              nom: 'Weasley',
              prenom: 'Ginny',
              statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
            },
            {
              idJeune: 'id-luna',
              idInscription: 'id-inscription-luna',
              nom: 'Lovegood',
              prenom: 'Luna',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            }
          ]
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))
        const command = {
          ...commandSansInscription,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              statut: SessionMilo.Modification.StatutInscription.REFUS_JEUNE,
              commentaire: 'J’ai pas envie'
            },
            {
              idJeune: 'id-ron',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            },
            {
              idJeune: 'id-ginny',
              statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
            },
            {
              idJeune: 'id-harry',
              statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
            },
            {
              idJeune: 'id-luna',
              statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
            }
          ]
        }

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          {
            ...supprimerInscriptions(session),
            estVisible: true,
            dateModification: uneDatetime()
          },
          {
            idsJeunesAInscrire: [],
            inscriptionsASupprimer: [],
            inscriptionsAModifier: [
              {
                idJeune: 'id-hermione',
                idInscription: 'id-inscription-hermione',
                statut: SessionMilo.Modification.StatutInscription.REFUS_JEUNE,
                commentaire: 'J’ai pas envie'
              },
              {
                idJeune: 'id-ron',
                idInscription: 'id-inscription-ron',
                statut: SessionMilo.Modification.StatutInscription.INSCRIT
              },
              {
                idJeune: 'id-ginny',
                idInscription: 'id-inscription-ginny',
                statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
              }
            ]
          },
          idpToken
        )
      })

      it('permet des modifications multiples', async () => {
        // Given
        const session = uneSessionMilo({
          inscriptions: [
            {
              idJeune: 'id-hermione',
              idInscription: 'id-inscription-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              idInscription: 'id-inscription-ron',
              nom: 'Weasley',
              prenom: 'Ronald',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            },
            {
              idJeune: 'id-ginny',
              idInscription: 'id-inscription-ginny',
              nom: 'Weasley',
              prenom: 'Ginny',
              statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
            },
            {
              idJeune: 'id-harry',
              idInscription: 'id-inscription-harry',
              nom: 'Lovegood',
              prenom: 'Luna',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            }
          ]
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))
        const command = {
          ...commandSansInscription,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              statut: SessionMilo.Modification.StatutInscription.REFUS_JEUNE,
              commentaire: 'J’ai pas envie'
            },
            {
              idJeune: 'id-ron',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            },
            {
              idJeune: 'id-ginny',
              statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
            },
            {
              idJeune: 'id-harry',
              statut: SessionMilo.Modification.StatutInscription.DESINSCRIT
            },
            {
              idJeune: 'id-luna',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            }
          ]
        }

        // When
        const result = await updateSessionMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(sessionMiloRepository.save).to.have.been.calledWithExactly(
          {
            ...supprimerInscriptions(session),
            estVisible: true,
            dateModification: uneDatetime()
          },
          {
            idsJeunesAInscrire: ['id-luna'],
            inscriptionsASupprimer: [
              { idJeune: 'id-harry', idInscription: 'id-inscription-harry' }
            ],
            inscriptionsAModifier: [
              {
                idJeune: 'id-hermione',
                idInscription: 'id-inscription-hermione',
                statut: SessionMilo.Modification.StatutInscription.REFUS_JEUNE,
                commentaire: 'J’ai pas envie'
              },
              {
                idJeune: 'id-ron',
                idInscription: 'id-inscription-ron',
                statut: SessionMilo.Modification.StatutInscription.INSCRIT
              },
              {
                idJeune: 'id-ginny',
                idInscription: 'id-inscription-ginny',
                statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
              }
            ]
          },
          idpToken
        )
      })

      it('empêche de dépasser le nombre maximum de participants', async () => {
        // Given
        const session = uneSessionMilo({
          nbPlacesDisponibles: 0,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              idInscription: 'id-inscription-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              idInscription: 'id-inscription-ron',
              nom: 'Weasley',
              prenom: 'Ronald',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ginny',
              idInscription: 'id-inscription-ginny',
              nom: 'Weasley',
              prenom: 'Ginny',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-luna',
              idInscription: 'id-inscription-luna',
              nom: 'Lovegood',
              prenom: 'Luna',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            }
          ]
        })
        sessionMiloRepository.getForConseiller.resolves(success(session))

        // When
        const commandAvecTropDInscrits = {
          ...commandSansInscription,
          inscriptions: [
            {
              idJeune: 'id-ron',
              statut: SessionMilo.Modification.StatutInscription.DESINSCRIT
            },
            {
              idJeune: 'id-ginny',
              statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
            },
            {
              idJeune: 'id-luna',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            },
            {
              idJeune: 'id-harry',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            },
            {
              idJeune: 'id-hagrid',
              statut: SessionMilo.Modification.StatutInscription.INSCRIT
            }
          ]
        }
        const result = await updateSessionMiloCommandHandler.handle(
          commandAvecTropDInscrits
        )

        // Then
        expect(result).to.deep.equal(failure(new MaxInscritsDepasse()))
        expect(sessionMiloRepository.save).not.to.have.been.called()
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
        accessToken: 'token'
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

function supprimerInscriptions(
  session: SessionMilo
): Omit<SessionMilo, 'inscriptions'> {
  const { inscriptions: _inscriptions, ...sessionSansInscriptions } = session
  return sessionSansInscriptions
}
