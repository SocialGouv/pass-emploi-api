import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SupportAuthorizer } from 'src/application/authorizers/support-authorizer'
import {
  DeleteSuperviseursCommand,
  DeleteSuperviseursCommandHandler
} from 'src/application/commands/support/delete-superviseurs.command.handler'
import { Superviseur } from 'src/domain/superviseur'
import { emptySuccess } from '../../../../src/building-blocks/types/result'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('DeleteSuperviseursCommandHandler', () => {
  let deleteSuperviseursCommandHandler: DeleteSuperviseursCommandHandler
  let superviseurRepository: StubbedType<Superviseur.Repository>
  let supportAuthorizer: StubbedClass<SupportAuthorizer>

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    superviseurRepository = stubInterface(sandbox)
    supportAuthorizer = stubClass(SupportAuthorizer)

    deleteSuperviseursCommandHandler = new DeleteSuperviseursCommandHandler(
      superviseurRepository,
      supportAuthorizer
    )
  })

  describe('handle', () => {
    describe('quand on veut supprimer une liste de superviseurs', () => {
      it('retourne un succes', async () => {
        // Given
        const command: DeleteSuperviseursCommand = {
          emails: ['test', 'test2']
        }

        superviseurRepository.deleteSuperviseurs.resolves(emptySuccess())

        // When
        const result = await deleteSuperviseursCommandHandler.handle(command)

        // Then
        expect(
          superviseurRepository.deleteSuperviseurs
        ).to.have.been.calledOnceWithExactly(command.emails)
        expect(result._isSuccess).to.equal(true)
      })
    })
  })
})
