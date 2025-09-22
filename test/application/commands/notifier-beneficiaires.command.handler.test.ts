import {
  NotifierBeneficiairesCommand,
  NotifierBeneficiairesCommandHandler
} from '../../../src/application/commands/notifier-beneficiaires.command.handler'
import { Notification } from '../../../src/domain/notification/notification'
import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Planificateur } from '../../../src/domain/planificateur'
import { createSandbox, StubbedClass, stubClass } from '../../utils'
import { uneDatetime } from '../../fixtures/date.fixture'
import { DateService } from '../../../src/utils/date-service'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Core } from '../../../src/domain/core'

describe('NotifierBeneficiairesCommandHandler', () => {
  let sandbox: SinonSandbox
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let handler: NotifierBeneficiairesCommandHandler
  const maintenant = uneDatetime()

  beforeEach(async () => {
    sandbox = createSandbox()
    const dateService: StubbedClass<DateService> = stubClass(DateService)
    dateService.now.returns(maintenant)
    planificateurRepository = stubInterface(sandbox)
    handler = new NotifierBeneficiairesCommandHandler(
      dateService,
      planificateurRepository
    )
  })

  afterEach(async () => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('crée un job planifié pour notifier les bénéficiaires', () => {
      //Given
      const command: NotifierBeneficiairesCommand = {
        type: Notification.Type.OUTILS,
        titre: "Les offres d'immersion sont disponibles",
        description: 'Rendez-vous sur la page des offres.',
        structures: [
          Core.Structure.POLE_EMPLOI_AIJ,
          Core.Structure.POLE_EMPLOI_BRSA
        ],
        push: true,
        batchSize: 2000,
        minutesEntreLesBatchs: 15
      }

      // When
      void handler.handle(command)

      // Then
      expect(
        planificateurRepository.ajouterJob
      ).to.have.been.calledOnceWithExactly({
        dateExecution: maintenant.toJSDate(),
        type: Planificateur.JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          type: Notification.Type.OUTILS,
          titre: "Les offres d'immersion sont disponibles",
          description: 'Rendez-vous sur la page des offres.',
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: true,
          batchSize: 2000,
          minutesEntreLesBatchs: 15
        }
      })
    })
  })
})
