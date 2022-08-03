import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Chat } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { Jeune } from 'src/domain/jeune/jeune'
import { unConseillerDuJeune, unJeune } from 'test/fixtures/jeune.fixture'
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
  const conseiller = unConseiller()
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    conseillerRepository.get.withArgs('idConseiller').resolves(conseiller)
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
      idConseillerSource: '40',
      idConseillerCible: '41',
      estTemporaire: false,
      idsJeunes: ['1', '2'],
      structure: Core.Structure.PASS_EMPLOI
    }
    describe('quand les conseillers et les jeunes correspondent au superviseur', () => {
      describe('quand le transfert est permanent', () => {
        it('sauvegarde les transferts et le jeune avec son nouveau conseiller', async () => {
          // Given
          conseillerRepository.existe
            .withArgs(command.idConseillerSource, command.structure)
            .resolves(true)
          const conseillerCible = unConseillerDuJeune({
            id: command.idConseillerCible
          })
          conseillerRepository.get
            .withArgs(command.idConseillerCible)
            .resolves(conseillerCible)

          const jeune1 = unJeune({
            id: command.idsJeunes[0],
            conseiller: {
              id: command.idConseillerSource,
              firstName: 'test',
              lastName: 'test'
            },
            conseillerInitial: undefined
          })
          const jeune2 = unJeune({
            id: command.idsJeunes[1],
            conseiller: {
              id: command.idConseillerSource,
              firstName: 'test',
              lastName: 'test'
            },
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
          expect(result).to.deep.equal(emptySuccess())

          jeune1.conseiller = conseillerCible
          jeune2.conseiller = conseillerCible
          expect(
            jeuneRepository.transferAndSaveAll
          ).to.have.been.calledWithExactly(
            [jeune1, jeune2],
            conseillerCible.id,
            command.idConseillerSource,
            command.estTemporaire
          )
          expect(
            chatRepository.envoyerMessageTransfert.getCall(0).args[0]
          ).to.deep.equal(jeune1)
          expect(
            chatRepository.envoyerMessageTransfert.getCall(1).args[0]
          ).to.deep.equal(jeune2)
        })
      })
      describe('quand le transfert est temporaire', () => {
        let command: TransfererJeunesConseillerCommand
        let conseillerCible: Jeune.Conseiller
        beforeEach(() => {
          command = {
            idConseillerSource: '40',
            idConseillerCible: '41',
            estTemporaire: true,
            idsJeunes: ['1'],
            structure: Core.Structure.PASS_EMPLOI
          }

          conseillerRepository.existe
            .withArgs(command.idConseillerSource, command.structure)
            .resolves(true)
          conseillerCible = unConseillerDuJeune({
            id: command.idConseillerCible
          })
          conseillerRepository.get
            .withArgs(command.idConseillerCible)
            .resolves(conseillerCible)
        })

        describe("quand le jeune n'était pas en transfert temporaire", () => {
          it('sauvegarde les transferts et le jeune son nouveau conseiller avec le conseiller initial', async () => {
            // Given
            const jeune1: Jeune = unJeune({
              id: command.idsJeunes[0],
              conseiller: {
                id: command.idConseillerSource,
                firstName: 'test',
                lastName: 'test'
              }
            })
            jeuneRepository.findAllJeunesByConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune1])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(command)

            // Then
            expect(result).to.deep.equal(emptySuccess())

            jeune1.conseiller = conseillerCible
            jeune1.conseillerInitial = { id: command.idConseillerSource }
            expect(
              jeuneRepository.transferAndSaveAll
            ).to.have.been.calledWithExactly(
              [jeune1],
              command.idConseillerCible,
              command.idConseillerSource,
              command.estTemporaire
            )
          })
        })
        describe('quand le jeune est déjà en transfert temporaire ', () => {
          it('sauvegarde le jeune avec le nouveau conseiller et conserve le conseiller initial', async () => {
            // Given
            const jeune1: Jeune = unJeune({
              id: command.idsJeunes[0],
              conseiller: {
                id: command.idConseillerSource,
                firstName: 'test',
                lastName: 'test'
              },
              conseillerInitial: {
                id: '42'
              }
            })
            jeuneRepository.findAllJeunesByConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune1])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(command)

            // Then
            expect(result).to.deep.equal(emptySuccess())

            jeune1.conseiller = conseillerCible
            expect(
              jeuneRepository.transferAndSaveAll
            ).to.have.been.calledWithExactly(
              [jeune1],
              command.idConseillerCible,
              command.idConseillerSource,
              command.estTemporaire
            )
          })
        })
        describe('quand le conseiller cible est le meme que le conseiller initial', () => {
          it('sauvegarde le jeune et supprime son conseiller initial', async () => {
            // Given
            const jeune1: Jeune = unJeune({
              id: command.idsJeunes[0],
              conseiller: {
                id: command.idConseillerSource,
                firstName: 'test',
                lastName: 'test'
              },
              conseillerInitial: {
                id: command.idConseillerCible
              }
            })
            jeuneRepository.findAllJeunesByConseiller
              .withArgs(command.idsJeunes, command.idConseillerSource)
              .resolves([jeune1])

            // When
            const result =
              await transfererJeunesConseillerCommandHandler.handle(command)

            // Then
            expect(result).to.deep.equal(emptySuccess())

            jeune1.conseiller = conseillerCible
            jeune1.conseillerInitial = undefined

            expect(
              jeuneRepository.transferAndSaveAll
            ).to.have.been.calledWithExactly(
              [jeune1],
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
        conseillerRepository.existe
          .withArgs(command.idConseillerSource, command.structure)
          .resolves(false)

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
        conseillerRepository.existe
          .withArgs(command.idConseillerSource, command.structure)
          .resolves(true)
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
        conseillerRepository.existe
          .withArgs(command.idConseillerSource, command.structure)
          .resolves(true)
        const conseillerCible = unConseiller({
          id: command.idConseillerCible,
          structure: command.structure
        })
        conseillerRepository.get
          .withArgs(command.idConseillerCible)
          .resolves(conseillerCible)

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
