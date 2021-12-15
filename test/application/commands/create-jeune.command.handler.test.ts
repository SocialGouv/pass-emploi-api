import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  CreateJeuneCommand,
  CreateJeuneCommandHandler
} from '../../../src/application/commands/create-jeune.command.handler'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, stubClass } from '../../utils'

describe('CreateJeuneCommandHandler', () => {
  let createJeuneCommandHandler: CreateJeuneCommandHandler
  const conseiller = unConseiller()
  const idNouveauJeune = 'DFKAL'
  const date = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
  const sandbox: SinonSandbox = createSandbox()
  const jeuneRepository: StubbedType<Jeune.Repository> = stubInterface(sandbox)
  const conseillerRepository: StubbedType<Conseiller.Repository> =
    stubInterface(sandbox)
  const chatRepository: StubbedType<Chat.Repository> = stubInterface(sandbox)
  const conseillerAuthorizer = stubClass(ConseillerAuthorizer)
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
      conseillerAuthorizer,
      idService,
      dateService
    )
  })

  describe('handle', () => {
    it('crée un jeune et initialise le chat si besoin', async () => {
      // Given
      const command: CreateJeuneCommand = {
        firstName: 'Kenji',
        lastName: 'Lefameux',
        idConseiller: conseiller.id
      }

      // When
      const result = await createJeuneCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal({
        id: idNouveauJeune,
        firstName: command.firstName,
        lastName: command.lastName,
        creationDate: date,
        conseiller: conseiller,
        structure: Core.Structure.PASS_EMPLOI
      })
      expect(chatRepository.initializeChatIfNotExists).to.have.been.calledWith(
        idNouveauJeune,
        conseiller.id
      )
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller', async () => {
      // Given
      const command: CreateJeuneCommand = {
        firstName: 'Kenji',
        lastName: 'Lefameux',
        idConseiller: conseiller.id
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await createJeuneCommandHandler.authorize(command, utilisateur)

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur
      )
    })
  })
})
