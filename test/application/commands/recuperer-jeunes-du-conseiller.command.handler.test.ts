import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Chat } from 'src/domain/chat'
import { Jeune } from 'src/domain/jeune/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  RecupererJeunesDuConseillerCommand,
  RecupererJeunesDuConseillerCommandHandler
} from '../../../src/application/commands/recuperer-jeunes-du-conseiller.command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/milo/conseiller'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('RecupererJeunesDuConseillerCommandHandler', () => {
  let recupererJeunesDuConseillerCommandHandler: RecupererJeunesDuConseillerCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  const conseiller = unConseiller()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    recupererJeunesDuConseillerCommandHandler =
      new RecupererJeunesDuConseillerCommandHandler(
        conseillerRepository,
        jeuneRepository,
        chatRepository,
        conseillerAuthorizer
      )
  })

  describe('handle', () => {
    const command: RecupererJeunesDuConseillerCommand = {
      idConseiller: conseiller.id
    }

    describe('quand le conseiller existe', () => {
      it('reaffecte les jeunes au conseiller', async () => {
        // Given
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(conseiller)

        const idConseillerSource1 = '11'
        const idConseillerSource2 = '22'

        const jeune1: Jeune = unJeune({
          id: '1',
          conseiller: {
            id: idConseillerSource1,
            firstName: 'test',
            lastName: 'test'
          },
          conseillerInitial: conseiller
        })
        const jeune2: Jeune = unJeune({
          id: '2',
          conseiller: {
            id: idConseillerSource2,
            firstName: 'test',
            lastName: 'test'
          },
          conseillerInitial: conseiller
        })
        const jeune3: Jeune = unJeune({
          id: '3',
          conseiller: {
            id: idConseillerSource1,
            firstName: 'test',
            lastName: 'test'
          },
          conseillerInitial: conseiller
        })
        jeuneRepository.findAllJeunesByConseillerInitial
          .withArgs(command.idConseiller)
          .resolves([jeune1, jeune2, jeune3])

        // When
        const result = await recupererJeunesDuConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())

        const conseillerActuel = {
          id: conseiller.id,
          firstName: conseiller.firstName,
          lastName: conseiller.lastName,
          email: conseiller.email
        }

        const expectedJeune1 = {
          ...jeune1,
          conseiller: conseillerActuel,
          conseillerInitial: undefined
        }
        const expectedJeune2 = {
          ...jeune2,
          conseiller: conseillerActuel,
          conseillerInitial: undefined
        }
        const expectedJeune3 = {
          ...jeune3,
          conseiller: conseillerActuel,
          conseillerInitial: undefined
        }

        expect(
          jeuneRepository.transferAndSaveAll.getCall(0).args
        ).to.deep.equal([
          [expectedJeune1, expectedJeune3],
          command.idConseiller,
          idConseillerSource1,
          command.idConseiller,
          Jeune.TypeTransfert.RECUPERATION
        ])
        expect(
          jeuneRepository.transferAndSaveAll.getCall(1).args
        ).to.deep.equal([
          [expectedJeune2],
          command.idConseiller,
          idConseillerSource2,
          command.idConseiller,
          Jeune.TypeTransfert.RECUPERATION
        ])

        expect(
          chatRepository.envoyerMessageTransfert.getCall(0).args[0]
        ).to.deep.equal(expectedJeune1)
        expect(
          chatRepository.envoyerMessageTransfert.getCall(1).args[0]
        ).to.deep.equal(expectedJeune3)
        expect(
          chatRepository.envoyerMessageTransfert.getCall(2).args[0]
        ).to.deep.equal(expectedJeune2)
      })
      it('ne fait rien quand pas de jeunes', async () => {
        // Given
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(conseiller)

        jeuneRepository.findAllJeunesByConseillerInitial
          .withArgs(command.idConseiller)
          .resolves([])

        // When
        const result = await recupererJeunesDuConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le conseiller n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        conseillerRepository.get
          .withArgs(command.idConseiller)
          .resolves(undefined)

        // When
        const result = await recupererJeunesDuConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Conseiller', command.idConseiller))
        )
      })
    })
  })
})
