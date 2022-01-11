import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { success } from 'src/building-blocks/types/result'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  CreateJeuneCommand,
  CreerJeunePoleEmploiCommandHandler
} from '../../../src/application/commands/creer-jeune-pole-emploi.command.handler'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Unauthorized } from '../../../src/domain/erreur'
import { Jeune } from '../../../src/domain/jeune'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, stubClass } from '../../utils'
import Structure = Core.Structure

describe('CreateJeuneCommandHandler', () => {
  let createJeuneCommandHandler: CreerJeunePoleEmploiCommandHandler
  const conseiller = unConseiller()
  const idNouveauJeune = 'ae1785ac-71f3-11ec-a0ba-cf33623dcff5'
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
    idService.uuid.returns(idNouveauJeune)
    dateService.now.returns(date)
    createJeuneCommandHandler = new CreerJeunePoleEmploiCommandHandler(
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
        email: 'kenji.lefameur@poleemploi.fr',
        idConseiller: conseiller.id
      }

      // When
      const result = await createJeuneCommandHandler.handle(command)

      // Then
      const expectedJeune = {
        id: idNouveauJeune,
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
        creationDate: date,
        conseiller: conseiller,
        structure: Core.Structure.POLE_EMPLOI
      }
      expect(result).to.deep.equal(success(expectedJeune))
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
        email: 'kenji.lefameur@poleemploi.fr',
        idConseiller: conseiller.id
      }

      const utilisateur = unUtilisateurConseiller({
        structure: Structure.POLE_EMPLOI
      })

      // When
      await createJeuneCommandHandler.authorize(command, utilisateur)

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur
      )
    })

    it('rejette un conseiller MILO', async () => {
      // Given
      const command: CreateJeuneCommand = {
        firstName: 'Kenji',
        lastName: 'Lefameux',
        email: 'kenji.lefameur@poleemploi.fr',
        idConseiller: conseiller.id
      }

      const utilisateur = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      // When
      const call = createJeuneCommandHandler.authorize(command, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
    })
  })
})
