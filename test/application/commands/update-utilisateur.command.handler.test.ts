import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from 'src/application/commands/update-utilisateur.command.handler'
import { Authentification } from 'src/domain/authentification'
import { unUtilisateur } from 'test/fixtures/authentification.fixture'
import { unUtilisateurQueryModel } from 'test/fixtures/query-models/authentification.query-model.fixtures'
import { isSuccess } from '../../../src/building-blocks/types/result'
import { expect } from '../../utils'

describe('UpdateUtilisateurCommandHandler', () => {
  let authentificationRepository: StubbedType<Authentification.Repository>
  let updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler

  before(() => {
    const sandbox: SinonSandbox = createSandbox()
    authentificationRepository = stubInterface(sandbox)

    updateUtilisateurCommandHandler = new UpdateUtilisateurCommandHandler(
      authentificationRepository
    )
  })

  describe('execute', () => {
    describe('token venant du SSO PassE', async () => {
      describe('conseiller connu', async () => {
        it('retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Authentification.Structure.PASS_EMPLOI
          }

          const utilisateur = unUtilisateur()
          authentificationRepository.get
            .withArgs(command.idUtilisateurAuth)
            .resolves(utilisateur)

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(unUtilisateurQueryModel())
          }
        })
      })
    })
  })
})
