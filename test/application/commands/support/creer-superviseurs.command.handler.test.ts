import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SupportAuthorizer } from 'src/application/authorizers/support-authorizer'
import {
  CreerSuperviseursCommand,
  CreerSuperviseursCommandHandler
} from 'src/application/commands/support/creer-superviseurs.command.handler'
import { Superviseur } from 'src/domain/superviseur'
import { emptySuccess } from '../../../../src/building-blocks/types/result'
import { Core } from '../../../../src/domain/core'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('CreerSuperviseursCommandHandler', () => {
  let creerSuperviseursCommandHandler: CreerSuperviseursCommandHandler
  let superviseurRepository: StubbedType<Superviseur.Repository>
  let supportAuthorizer: StubbedClass<SupportAuthorizer>

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    superviseurRepository = stubInterface(sandbox)
    supportAuthorizer = stubClass(SupportAuthorizer)

    creerSuperviseursCommandHandler = new CreerSuperviseursCommandHandler(
      superviseurRepository,
      supportAuthorizer
    )
  })

  describe('handle', () => {
    describe('quand on veut enregistrer une liste de superviseurs', () => {
      it('retourne un succes', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superviseurs: [
            { email: 'test', structure: Core.Structure.MILO },
            { email: 'test2', structure: Core.Structure.MILO }
          ]
        }

        superviseurRepository.saveSuperviseurs
          .withArgs(command.superviseurs)
          .resolves(emptySuccess())

        // When
        const result = await creerSuperviseursCommandHandler.handle(command)

        // Then
        expect(superviseurRepository.saveSuperviseurs).to.have.callCount(1)
        expect(result._isSuccess).to.equal(true)
      })
    })
    describe('quand on veut enregistrer un superEmailFT', () => {
      it('retourne un succes', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superEmailFT: 'test@ft'
        }

        superviseurRepository.saveSuperviseurs.resolves(emptySuccess())

        // When
        const result = await creerSuperviseursCommandHandler.handle(command)

        // Then
        expect(
          superviseurRepository.saveSuperviseurs
        ).to.have.been.calledOnceWithExactly([
          { email: 'test@ft', structure: Core.Structure.POLE_EMPLOI },
          { email: 'test@ft', structure: Core.Structure.POLE_EMPLOI_BRSA },
          { email: 'test@ft', structure: Core.Structure.POLE_EMPLOI_AIJ },
          {
            email: 'test@ft',
            structure: Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF
          },
          {
            email: 'test@ft',
            structure: Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL
          },
          {
            email: 'test@ft',
            structure: Core.Structure.FT_EQUIP_EMPLOI_RECRUT
          },
          { email: 'test@ft', structure: Core.Structure.AVENIR_PRO }
        ])
        expect(result._isSuccess).to.equal(true)
      })
    })
  })
})
