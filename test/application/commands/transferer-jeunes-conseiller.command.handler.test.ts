import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Chat } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { Jeune } from 'src/domain/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { TransfererJeunesConseillerCommandHandler } from '../../../src/application/commands/transferer-jeunes-conseiller.command.handler'
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
import Structure = Core.Structure

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
    const command = {
      idConseillerSource: '40',
      idConseillerCible: '41',
      idsJeune: ['1', '2'],
      structure: Core.Structure.PASS_EMPLOI
    }
    describe('quand les conseillers et les jeunes correspondent au superviseur', () => {
      it('retourne un success', async () => {
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

        const jeune1 = unJeune({
          id: command.idsJeune[0],
          conseiller: {
            id: command.idConseillerSource,
            firstName: 'test',
            lastName: 'test',
            structure: Structure.PASS_EMPLOI,
            notificationsSonores: false
          }
        })
        const jeune2 = unJeune({
          id: command.idsJeune[1],
          conseiller: {
            id: command.idConseillerSource,
            firstName: 'test',
            lastName: 'test',
            structure: Structure.PASS_EMPLOI,
            notificationsSonores: false
          }
        })
        jeuneRepository.findAllJeunesByConseiller
          .withArgs(command.idsJeune, command.idConseillerSource)
          .resolves([jeune1, jeune2])

        // When
        const result = await transfererJeunesConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(jeuneRepository.creerTransferts).to.have.been.calledWithExactly(
          command.idConseillerSource,
          command.idConseillerCible,
          command.idsJeune
        )
        expect(chatRepository.transfererChat).to.have.been.calledWithExactly(
          command.idConseillerCible,
          command.idsJeune
        )

        jeune1.conseiller = conseillerCible
        jeune2.conseiller = conseillerCible
        expect(jeuneRepository.saveAll).to.have.been.calledWithExactly([
          jeune1,
          jeune2
        ])
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
          .withArgs(command.idsJeune, command.idConseillerSource)
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
