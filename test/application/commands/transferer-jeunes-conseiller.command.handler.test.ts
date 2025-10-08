import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Chat } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { Jeune } from 'src/domain/jeune/jeune'
import { RendezVous } from 'src/domain/rendez-vous/rendez-vous'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from '../../../src/application/commands/transferer-jeunes-conseiller.command.handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/milo/conseiller'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { SupportAuthorizer } from '../../../src/application/authorizers/support-authorizer'
import { Authentification } from '../../../src/domain/authentification'
import Structure = Core.Structure
import {
  unUtilisateurConseiller,
  unUtilisateurSupport
} from '../../fixtures/authentification.fixture'

describe('TransfererJeunesConseillerCommandHandler', () => {
  let transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler
  const conseillerSource = unConseiller({
    id: 'idConseillerSource',
    agence: {
      id: '1',
      nom: 'Pôle emploi PARIS'
    }
  })

  const conseillerCible = unConseiller({
    id: 'idConseillerCible',
    agence: {
      id: '1',
      nom: 'Pôle emploi PARIS'
    }
  })

  const conseillerCibleDuJeune: Jeune.Conseiller = {
    id: conseillerCible.id,
    firstName: conseillerCible.firstName,
    lastName: conseillerCible.lastName,
    email: conseillerCible.email
  }

  const conseillerSourceDuJeune: Jeune.Conseiller = {
    id: conseillerSource.id,
    firstName: conseillerSource.firstName,
    lastName: conseillerSource.lastName,
    email: conseillerSource.email
  }

  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let listesDeDiffusionService: StubbedClass<Conseiller.ListeDeDiffusion.Service>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let supportAuthorizer: StubbedClass<SupportAuthorizer>
  let animationCollectiveService: StubbedClass<RendezVous.AnimationCollective.Service>
  let sandbox: SinonSandbox

  beforeEach(async () => {
    sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    conseillerRepository.get
      .withArgs(conseillerSource.id)
      .resolves(conseillerSource)
    conseillerRepository.get
      .withArgs(conseillerCible.id)
      .resolves(conseillerCible)

    chatRepository = stubInterface(sandbox)
    listesDeDiffusionService = stubClass(Conseiller.ListeDeDiffusion.Service)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    supportAuthorizer = stubClass(SupportAuthorizer)
    animationCollectiveService = stubClass(
      RendezVous.AnimationCollective.Service
    )
    transfererJeunesConseillerCommandHandler =
      new TransfererJeunesConseillerCommandHandler(
        conseillerRepository,
        jeuneRepository,
        listesDeDiffusionService,
        chatRepository,
        animationCollectiveService,
        conseillerAuthorizer,
        supportAuthorizer
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const command: TransfererJeunesConseillerCommand = {
      idConseillerSource: conseillerSource.id,
      idConseillerCible: conseillerCible.id,
      estTemporaire: false,
      idsJeunes: ['1', '2'],
      provenanceUtilisateur: Authentification.Type.CONSEILLER
    }
    const utilisateur = unUtilisateurConseiller({
      structure: Core.Structure.POLE_EMPLOI
    })
    const utilisateurSuperviseurResponsable = unUtilisateurConseiller({
      structure: Core.Structure.POLE_EMPLOI,
      roles: [Authentification.Role.SUPERVISEUR_RESPONSABLE]
    })

    describe('succès', () => {
      describe('quand le transfert est permanent', () => {
        let result: Result
        let jeune1ApresTransfert: Jeune
        let jeune2ApresTransfert: Jeune
        beforeEach(async () => {
          // Given
          conseillerRepository.get
            .onFirstCall()
            .resolves(conseillerSource)
            .onSecondCall()
            .resolves(conseillerCible)
          const jeune1 = unJeune({
            id: command.idsJeunes[0],
            conseiller: conseillerSourceDuJeune,
            conseillerInitial: undefined
          })
          const jeune2 = unJeune({
            id: command.idsJeunes[1],
            conseiller: conseillerSourceDuJeune,
            conseillerInitial: undefined
          })
          jeuneRepository.findAllJeunesByIdsAndConseiller
            .withArgs(command.idsJeunes, command.idConseillerSource)
            .resolves([jeune1, jeune2])

          // When
          result = await transfererJeunesConseillerCommandHandler.handle(
            command,
            utilisateur
          )

          // Then
          jeune1ApresTransfert = {
            ...jeune1,
            conseiller: conseillerCibleDuJeune
          }
          jeune2ApresTransfert = {
            ...jeune2,
            conseiller: conseillerCibleDuJeune
          }
        })

        it('sauvegarde les transferts et les jeunes avec leur nouveau conseiller', async () => {
          // Then
          expect(result).to.deep.equal(emptySuccess())
          expect(
            jeuneRepository.transferAndSaveAll
          ).to.have.been.calledWithExactly(
            [jeune1ApresTransfert, jeune2ApresTransfert],
            conseillerCible.id,
            command.idConseillerSource,
            utilisateur.id,
            Jeune.TypeTransfert.DEFINITIF
          )
        })

        it('préviens les jeunes du transfert', async () => {
          // Then
          expect(
            chatRepository.envoyerMessageTransfert.getCall(0).args[0]
          ).to.deep.equal(jeune1ApresTransfert)
          expect(
            chatRepository.envoyerMessageTransfert.getCall(1).args[0]
          ).to.deep.equal(jeune2ApresTransfert)
        })

        it('supprime les jeunes des listes de diffusion du conseiller', async () => {
          expect(
            listesDeDiffusionService.enleverLesJeunesDuConseiller
          ).to.have.been.calledOnceWithExactly(
            command.idConseillerSource,
            command.idsJeunes
          )
        })
      })
      describe('quand le transfert est temporaire', () => {
        const command: TransfererJeunesConseillerCommand = {
          idConseillerSource: conseillerSource.id,
          idConseillerCible: conseillerCible.id,
          estTemporaire: true,
          idsJeunes: ['1'],
          provenanceUtilisateur: Authentification.Type.CONSEILLER
        }

        beforeEach(async () => {
          conseillerRepository.get
            .onFirstCall()
            .resolves(conseillerSource)
            .onSecondCall()
            .resolves(conseillerCible)
        })

        describe("quand le jeune n'était pas en transfert temporaire", () => {
          it('sauvegarde les transferts et le jeune son nouveau conseiller avec le conseiller initial', async () => {
            // Given
            const jeune: Jeune = unJeune({
              id: command.idsJeunes[0],
              conseiller: {
                id: conseillerSource.id,
                firstName: conseillerSource.firstName,
                lastName: conseillerSource.lastName
              }
            })

            jeuneRepository.findAllJeunesByIdsAndConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            const jeuneApresTransfert: Jeune = {
              ...jeune,
              conseiller: conseillerCibleDuJeune,
              conseillerInitial: { id: conseillerSourceDuJeune.id }
            }
            expect(result).to.deep.equal(emptySuccess())
            expect(
              jeuneRepository.transferAndSaveAll
            ).to.have.been.calledWithExactly(
              [jeuneApresTransfert],
              command.idConseillerCible,
              command.idConseillerSource,
              utilisateur.id,
              Jeune.TypeTransfert.TEMPORAIRE
            )
          })
        })
        describe('quand le jeune est déjà en transfert temporaire ', () => {
          it('sauvegarde le jeune avec le nouveau conseiller et conserve le conseiller initial', async () => {
            // Given
            const jeune: Jeune = unJeune({
              id: command.idsJeunes[0],
              conseiller: {
                id: conseillerSource.id,
                firstName: conseillerSource.firstName,
                lastName: conseillerSource.lastName
              },
              conseillerInitial: {
                id: '42'
              }
            })

            jeuneRepository.findAllJeunesByIdsAndConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            const jeuneApresTransfert: Jeune = {
              ...jeune,
              conseiller: conseillerCibleDuJeune
            }
            expect(result).to.deep.equal(emptySuccess())
            expect(
              jeuneRepository.transferAndSaveAll
            ).to.have.been.calledWithExactly(
              [jeuneApresTransfert],
              command.idConseillerCible,
              command.idConseillerSource,
              utilisateur.id,
              Jeune.TypeTransfert.TEMPORAIRE
            )
          })
        })
        describe('quand le conseiller cible est le meme que le conseiller initial', () => {
          it('sauvegarde le jeune et supprime son conseiller initial', async () => {
            // Given
            const jeune: Jeune = unJeune({
              id: command.idsJeunes[0],
              conseiller: {
                id: conseillerSource.id,
                firstName: conseillerSource.firstName,
                lastName: conseillerSource.lastName
              },
              conseillerInitial: {
                id: command.idConseillerCible
              }
            })

            jeuneRepository.findAllJeunesByIdsAndConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            const jeuneApresTransfert: Jeune = {
              ...jeune,
              conseiller: conseillerCibleDuJeune,
              conseillerInitial: undefined
            }
            expect(result).to.deep.equal(emptySuccess())
            expect(
              jeuneRepository.transferAndSaveAll
            ).to.have.been.calledWithExactly(
              [jeuneApresTransfert],
              command.idConseillerCible,
              command.idConseillerSource,
              utilisateur.id,
              Jeune.TypeTransfert.TEMPORAIRE
            )
          })
        })
      })
      describe("quand il y a un changement d'agence", () => {
        it("désinscrit les jeunes des animations collectives de l'ancienne agence", async () => {
          // Given
          const conseillerCibleDeNantes = unConseiller({
            id: 'conseillerCibleDeNantes',
            agence: {
              id: '44',
              nom: 'Pôle emploi NANTES'
            }
          })
          conseillerRepository.get
            .withArgs(conseillerSource.id)
            .resolves(conseillerSource)

          conseillerRepository.get
            .withArgs(conseillerCibleDeNantes.id)
            .resolves(conseillerCibleDeNantes)

          const command: TransfererJeunesConseillerCommand = {
            idConseillerSource: conseillerSource.id,
            idConseillerCible: conseillerCibleDeNantes.id,
            estTemporaire: false,
            idsJeunes: ['1'],
            provenanceUtilisateur: Authentification.Type.CONSEILLER
          }

          const jeuneQuiVientANantes = unJeune({
            id: command.idsJeunes[0],
            conseiller: conseillerSourceDuJeune,
            conseillerInitial: undefined
          })
          jeuneRepository.findAllJeunesByIdsAndConseiller
            .withArgs(command.idsJeunes, command.idConseillerSource)
            .resolves([jeuneQuiVientANantes])

          // When
          await transfererJeunesConseillerCommandHandler.handle(
            command,
            utilisateur
          )

          // Then
          expect(
            animationCollectiveService.desinscrireJeunesDesAnimationsCollectivesDUnEtablissement
          ).to.have.been.calledWithExactly(
            [jeuneQuiVientANantes.id],
            conseillerSource.agence?.id
          )
        })
      })
    })
    describe('succès superviseur France Travail', () => {
      it('effectue un transfert pour des conseillers de structure différente de celle du supérviseur', async () => {
        // Given
        const conseillerSourceBRSA = unConseiller({
          id: 'idConseillerSourceBRSA',
          agence: {
            id: '1',
            nom: 'Pôle emploi PARIS'
          },
          structure: Core.Structure.POLE_EMPLOI_BRSA
        })

        const conseillerCibleAIJ = unConseiller({
          id: 'idConseillerCibleBRSA',
          agence: {
            id: '1',
            nom: 'Pôle emploi PARIS'
          },
          structure: Core.Structure.POLE_EMPLOI_AIJ
        })
        const command: TransfererJeunesConseillerCommand = {
          idConseillerSource: conseillerSourceBRSA.id,
          idConseillerCible: conseillerCibleAIJ.id,
          estTemporaire: false,
          idsJeunes: ['1'],
          provenanceUtilisateur: Authentification.Type.CONSEILLER
        }

        conseillerRepository.get
          .onFirstCall()
          .resolves(conseillerSourceBRSA)
          .onSecondCall()
          .resolves(conseillerCibleAIJ)
        const jeune1 = unJeune({
          id: command.idsJeunes[0],
          conseiller: conseillerSourceDuJeune,
          conseillerInitial: undefined
        })
        jeuneRepository.findAllJeunesByIdsAndConseiller
          .withArgs(command.idsJeunes, command.idConseillerSource)
          .resolves([jeune1])

        // When
        const result = await transfererJeunesConseillerCommandHandler.handle(
          command,
          utilisateurSuperviseurResponsable
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('échecs', () => {
      describe('en tant que superviseur', () => {
        describe('quand ma structure est différente de celles des conseillers source et cible', () => {
          it('retourne une MauvaiseCommandeError', async () => {
            // Given
            const conseillerSource = unConseiller({
              structure: Structure.MILO
            })
            const conseillerCible = unConseiller({ structure: Structure.MILO })

            const command: TransfererJeunesConseillerCommand = {
              idConseillerSource: conseillerSource.id,
              idConseillerCible: conseillerCible.id,
              estTemporaire: false,
              idsJeunes: ['1', '2'],
              provenanceUtilisateur: Authentification.Type.CONSEILLER
            }

            conseillerRepository.get
              .onFirstCall()
              .resolves(conseillerSource)
              .onSecondCall()
              .resolves(conseillerCible)

            jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([
              unJeune(),
              unJeune()
            ])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            expect(!result._isSuccess && result.error).to.deep.equal(
              new MauvaiseCommandeError(
                'Les conseillers source et cible doivent être rattachées à France Travail'
              )
            )
          })
        })
      })
      describe('en tant que support', () => {
        describe('quand la structure des conseillers source et cible est différente', () => {
          it('retourne une MauvaiseCommandeError', async () => {
            const conseillerSource = unConseiller({
              id: '1',
              structure: Structure.POLE_EMPLOI
            })
            const conseillerCible = unConseiller({
              id: '2',
              structure: Structure.MILO
            })

            // Given
            const command: TransfererJeunesConseillerCommand = {
              idConseillerSource: conseillerSource.id,
              idConseillerCible: conseillerCible.id,
              estTemporaire: false,
              idsJeunes: ['1', '2'],
              provenanceUtilisateur: Authentification.Type.SUPPORT
            }
            const utilisateurSupport = unUtilisateurSupport()

            conseillerRepository.get
              .onFirstCall()
              .resolves(conseillerSource)
              .onSecondCall()
              .resolves(conseillerCible)

            jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([
              unJeune(),
              unJeune()
            ])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateurSupport
              )

            // Then
            expect(!result._isSuccess && result.error).to.deep.equal(
              new MauvaiseCommandeError(
                'Les informations de structure ne correspondent pas'
              )
            )
          })
        })
      })
      describe('commun', () => {
        describe("quand le conseiller source n'existe pas", () => {
          it('retourne une failure', async () => {
            // Given
            conseillerRepository.get
              .withArgs(command.idConseillerSource)
              .resolves(undefined)

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTrouveError('Conseiller', command.idConseillerSource)
              )
            )
          })
        })
        describe("quand le conseiller cible n'existe pas", () => {
          it('retourne une failure', async () => {
            // Given
            conseillerRepository.get
              .withArgs(command.idConseillerCible)
              .resolves(undefined)

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTrouveError('Conseiller', command.idConseillerCible)
              )
            )
          })
        })
        describe("quand un des jeunes n'existe pas ou n'est pas suivi par le conseiller source", () => {
          it('retourne une failure', async () => {
            // Given
            jeuneRepository.findAllJeunesByIdsAndConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([unJeune()])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(
                command,
                utilisateur
              )

            // Then
            expect(result).to.deep.equal(
              failure(
                new MauvaiseCommandeError(
                  'Liste des jeunes à transférer invalide'
                )
              )
            )
          })
        })
      })
    })
  })
})
