import {
  NotifierBeneficiairesCommand,
  NotifierBeneficiairesCommandHandler
} from '../../../src/application/commands/notifier-beneficiaires.command.handler'
import { Notification } from '../../../src/domain/notification/notification'
import { SinonSandbox } from 'sinon'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Planificateur } from '../../../src/domain/planificateur'
import { createSandbox, StubbedClass, stubClass, expect } from '../../utils'
import { uneDatetime } from '../../fixtures/date.fixture'
import { DateService } from '../../../src/utils/date-service'
import { Core } from '../../../src/domain/core'
import { failure, success } from '../../../src/building-blocks/types/result'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import JobNotifierBeneficiaires = Planificateur.JobNotifierBeneficiaires

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
    it('crée un job planifié pour notifier les bénéficiaires', async () => {
      //Given
      planificateurRepository.recupererPremierJobNonTermine.resolves(null)
      const jobId = '2'
      planificateurRepository.ajouterJob.resolves(jobId)

      const command: NotifierBeneficiairesCommand = {
        typeNotification: Notification.Type.OUTILS,
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
      const result = await handler.handle(command)

      // Then
      expect(
        planificateurRepository.ajouterJob
      ).to.have.been.calledOnceWithExactly({
        dateExecution: maintenant.toJSDate(),
        type: Planificateur.JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: "Les offres d'immersion sont disponibles",
          description: 'Rendez-vous sur la page des offres.',
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: true,
          batchSize: 2000,
          minutesEntreLesBatchs: 15
        } as JobNotifierBeneficiaires
      })
      expect(result).to.deep.equal(success({ jobId: jobId }))
    })

    it('ne crée pas de job si un job NOTIFIER_BENEFICIAIRES existe déjà', async () => {
      //Given
      planificateurRepository.recupererPremierJobNonTermine.resolves('1')

      const command: NotifierBeneficiairesCommand = {
        typeNotification: Notification.Type.OUTILS,
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
      const result = await handler.handle(command)

      // Then
      expect(planificateurRepository.ajouterJob).not.to.have.been.called()
      expect(result).to.deep.equal(
        failure(
          new MauvaiseCommandeError(
            'Un job de type NOTIFIER_BENEFICIAIRES est déjà planifié (id=1).'
          )
        )
      )
    })
  })
})
