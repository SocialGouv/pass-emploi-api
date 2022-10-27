import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Chat } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { Jeune } from 'src/domain/jeune/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
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
  failure
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

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
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    conseillerRepository.get
      .withArgs(conseillerSource.id)
      .resolves(conseillerSource)
    conseillerRepository.get
      .withArgs(conseillerCible.id)
      .resolves(conseillerCible)

    chatRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    transfererJeunesConseillerCommandHandler =
      new TransfererJeunesConseillerCommandHandler(
        conseillerRepository,
        jeuneRepository,
        chatRepository,
        conseillerAuthorizer
      )
  })

  describe('handle', () => {
    const command: TransfererJeunesConseillerCommand = {
      idConseillerSource: conseillerSource.id,
      idConseillerCible: conseillerCible.id,
      estTemporaire: false,
      idsJeunes: ['1', '2'],
      structure: Core.Structure.PASS_EMPLOI
    }

    describe('quand les conseillers et les jeunes correspondent au superviseur', () => {
      describe('quand le transfert est permanent', () => {
        it('sauvegarde les transferts et le jeune avec son nouveau conseiller', async () => {
          // Given
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
          jeuneRepository.findAllJeunesByConseiller
            .withArgs(command.idsJeunes, command.idConseillerSource)
            .resolves([jeune1, jeune2])

          // When
          const result = await transfererJeunesConseillerCommandHandler.handle(
            command
          )

          // Then
          const jeune1ApresTransfert: Jeune = {
            ...jeune1,
            conseiller: conseillerCibleDuJeune
          }
          const jeune2ApresTransfert: Jeune = {
            ...jeune2,
            conseiller: conseillerCibleDuJeune
          }
          expect(result).to.deep.equal(emptySuccess())
          expect(
            jeuneRepository.transferAndSaveAll
          ).to.have.been.calledWithExactly(
            [jeune1ApresTransfert, jeune2ApresTransfert],
            conseillerCible.id,
            command.idConseillerSource,
            command.estTemporaire
          )
          expect(
            chatRepository.envoyerMessageTransfert.getCall(0).args[0]
          ).to.deep.equal(jeune1ApresTransfert)
          expect(
            chatRepository.envoyerMessageTransfert.getCall(1).args[0]
          ).to.deep.equal(jeune2ApresTransfert)
        })
      })

      describe('quand le transfert est temporaire', () => {
        const command: TransfererJeunesConseillerCommand = {
          idConseillerSource: conseillerSource.id,
          idConseillerCible: conseillerCible.id,
          estTemporaire: true,
          idsJeunes: ['1'],
          structure: Core.Structure.PASS_EMPLOI
        }

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

            jeuneRepository.findAllJeunesByConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(command)

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
              command.estTemporaire
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

            jeuneRepository.findAllJeunesByConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(command)

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
              command.estTemporaire
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

            jeuneRepository.findAllJeunesByConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(command)

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
              command.estTemporaire
            )
          })
        })
      })
    })
    describe("quand le conseiller source n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        conseillerRepository.get
          .withArgs(command.idConseillerSource)
          .resolves(undefined)

        // When
        const result = await transfererJeunesConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Conseiller', command.idConseillerSource))
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
        const result = await transfererJeunesConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Conseiller', command.idConseillerCible))
        )
      })
    })
    describe("quand un des jeunes n'existe pas ou n'est pas suivi par le conseiller source", () => {
      it('retourne une failure', async () => {
        // Given
        jeuneRepository.findAllJeunesByConseiller
          .withArgs(command.idsJeunes, command.idConseillerSource)
          .resolves([unJeune()])

        // When
        const result = await transfererJeunesConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError('Liste des jeunes à transférer invalide')
          )
        )
      })
    })
  })
})
