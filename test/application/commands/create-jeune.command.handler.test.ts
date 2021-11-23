import { Jeune } from '../../../src/domain/jeune'
import { createSandbox, expect, stubClass } from '../../utils'
import {
  CreateJeuneCommand,
  CreateJeuneCommandHandler
} from '../../../src/application/commands/create-jeune.command.handler'
import { Conseiller } from '../../../src/domain/conseiller'
import { Chat } from '../../../src/domain/chat'
import { IdService } from '../../../src/utils/id-service'
import { DateService } from '../../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { DateTime } from 'luxon'

describe('CreateJeuneCommandHandler', () => {
  describe('execute', () => {
    let createJeuneCommandHandler: CreateJeuneCommandHandler
    const conseiller = unConseiller()
    const idNouveauJeune = 'DFKAL'
    const date = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
    const sandbox: SinonSandbox = createSandbox()
    const jeuneRepository: StubbedType<Jeune.Repository> =
      stubInterface(sandbox)
    const conseillerRepository: StubbedType<Conseiller.Repository> =
      stubInterface(sandbox)
    const chatRepository: StubbedType<Chat.Repository> = stubInterface(sandbox)
    const dateService = stubClass(DateService)
    const idService = stubClass(IdService)
    before(async () => {
      conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)
      idService.generate.returns(idNouveauJeune)
      dateService.now.returns(date)
      createJeuneCommandHandler = new CreateJeuneCommandHandler(
        jeuneRepository,
        conseillerRepository,
        chatRepository,
        idService,
        dateService
      )
    })

    it('crée un jeune et initialise le chat si besoin', async () => {
      // Given
      const command: CreateJeuneCommand = {
        firstName: 'Kenji',
        lastName: 'Lefameux',
        idConseiller: conseiller.id
      }

      // When
      const result = await createJeuneCommandHandler.execute(command)

      // Then
      expect(result).to.deep.equal({
        id: idNouveauJeune,
        firstName: command.firstName,
        lastName: command.lastName,
        creationDate: date,
        conseiller: conseiller
      })
      expect(chatRepository.initializeChatIfNotExists).to.have.been.calledWith(
        idNouveauJeune,
        conseiller.id
      )
    })
  })
})
