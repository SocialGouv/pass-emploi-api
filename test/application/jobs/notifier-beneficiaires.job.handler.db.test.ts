import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { Notification } from '../../../src/domain/notification/notification'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { NotifierBeneficiairesJobHandler } from '../../../src/application/jobs/notifier-beneficiaires.job.handler.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { Core } from '../../../src/domain/core'
import { TIME_ZONE_EUROPE_PARIS } from '../../../src/config/configuration'
import JobType = Planificateur.JobType

const idJeune1 = 'j1'
const idJeune2 = 'j2'
const idJeune3 = 'j3'
const idJeune4 = 'j4'
const idJeune5 = 'j5'
const maintenant = uneDatetime()

describe('NotifierBeneficiairesJobHandler', () => {
  let handler: NotifierBeneficiairesJobHandler
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let notificationRepository: StubbedClass<Notification.Repository>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let sandbox: SinonSandbox

  before(async () => {
    const databaseForTesting = getDatabase()
    await databaseForTesting.cleanPG()

    sandbox = createSandbox()
    notificationRepository = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    suiviJobService = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)

    handler = new NotifierBeneficiairesJobHandler(
      notificationRepository,
      suiviJobService,
      dateService,
      planificateurRepository
    )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  afterEach(async () => {
    sandbox.reset()
  })

  describe('handle', () => {
    it('envoie une notification aux bénéficiaires de la bonne structure', async () => {
      // Given
      // Conseiller
      await ConseillerSqlModel.bulkCreate([
        unConseillerDto({
          id: 'con1'
        })
      ])
      // Jeunes
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({
          id: idJeune1,
          idConseiller: 'con1',
          pushNotificationToken: 'push1',
          structure: Core.Structure.POLE_EMPLOI_AIJ
        }),
        unJeuneDto({
          id: idJeune2,
          idConseiller: 'con1',
          pushNotificationToken: null,
          structure: Core.Structure.POLE_EMPLOI_AIJ
        }),
        unJeuneDto({
          id: idJeune3,
          idConseiller: 'con1',
          pushNotificationToken: 'push3',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: idJeune4,
          idConseiller: 'con1',
          pushNotificationToken: 'push4',
          structure: Core.Structure.POLE_EMPLOI_BRSA
        }),
        unJeuneDto({
          id: idJeune5,
          idConseiller: 'con1',
          pushNotificationToken: 'push5',
          structure: Core.Structure.POLE_EMPLOI_AIJ
        })
      ])

      const maintenant = uneDatetime()
      const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
        dateExecution: maintenant.toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: true,
          batchSize: 2,
          minutesEntreLesBatchs: 5
        }
      }

      // When
      const result = await handler.handle(job)

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        estLaDerniereExecution: false,
        nbBeneficiairesNotifies: 2
      })
      expect(notificationRepository.send).to.have.been.calledTwice()
      expect(
        notificationRepository.send.firstCall
      ).to.have.been.calledWithExactly(
        {
          token: 'push1',
          notification: {
            title: job.contenu.titre,
            body: job.contenu.description
          },
          data: {
            type: job.contenu.typeNotification
          }
        },
        idJeune1,
        true
      )
      expect(
        notificationRepository.send.secondCall
      ).to.have.been.calledWithExactly(
        {
          token: 'push4',
          notification: {
            title: job.contenu.titre,
            body: job.contenu.description
          },
          data: {
            type: job.contenu.typeNotification
          }
        },
        idJeune4,
        true
      )
      expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
        dateExecution: maintenant.plus({ minute: 5 }).toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: true,
          batchSize: 2,
          minutesEntreLesBatchs: 5,
          offset: 2,
          nbBeneficiairesNotifies: 2
        }
      })
    })

    it("n'envoie pas de notification push si ce n'est pas spécifié dans le job", async () => {
      // Given
      await ConseillerSqlModel.bulkCreate([
        unConseillerDto({
          id: 'con1'
        })
      ])
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({
          id: idJeune1,
          idConseiller: 'con1',
          pushNotificationToken: 'push1',
          structure: Core.Structure.POLE_EMPLOI_AIJ
        })
      ])

      const maintenant = uneDatetime()
      const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
        dateExecution: maintenant.toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: false,
          batchSize: 1,
          minutesEntreLesBatchs: 5
        }
      }

      // When
      const result = await handler.handle(job)

      // Then
      expect(result.succes).to.be.true()
      expect(notificationRepository.send).to.have.been.calledOnce()
      expect(notificationRepository.send).to.have.been.calledWithExactly(
        {
          token: 'push1',
          notification: {
            title: job.contenu.titre,
            body: job.contenu.description
          },
          data: {
            type: job.contenu.typeNotification
          }
        },
        idJeune1,
        false
      )
      expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
        dateExecution: maintenant.plus({ minute: 5 }).toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: false,
          batchSize: 1,
          minutesEntreLesBatchs: 5,
          offset: 1,
          nbBeneficiairesNotifies: 1
        }
      })
    })

    it("détermine la taille du batch à 20% de la population à notifier si elle n'est pas définie", async () => {
      // Given
      // Conseiller
      await ConseillerSqlModel.bulkCreate([
        unConseillerDto({
          id: 'con1'
        })
      ])
      // 11 jeunes MILO
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({
          id: 'j1',
          idConseiller: 'con1',
          pushNotificationToken: 'push1',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j2',
          idConseiller: 'con1',
          pushNotificationToken: 'push2',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j3',
          idConseiller: 'con1',
          pushNotificationToken: 'push3',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j4',
          idConseiller: 'con1',
          pushNotificationToken: 'push4',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j5',
          idConseiller: 'con1',
          pushNotificationToken: 'push5',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j6',
          idConseiller: 'con1',
          pushNotificationToken: 'push6',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j7',
          idConseiller: 'con1',
          pushNotificationToken: 'push7',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j8',
          idConseiller: 'con1',
          pushNotificationToken: 'push8',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j9',
          idConseiller: 'con1',
          pushNotificationToken: 'push9',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j10',
          idConseiller: 'con1',
          pushNotificationToken: 'push10',
          structure: Core.Structure.MILO
        }),
        unJeuneDto({
          id: 'j11',
          idConseiller: 'con1',
          pushNotificationToken: 'push11',
          structure: Core.Structure.MILO
        })
      ])

      const maintenant = uneDatetime()
      const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
        dateExecution: maintenant.toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [Core.Structure.MILO],
          push: true,
          batchSize: undefined,
          minutesEntreLesBatchs: undefined
        }
      }

      // When
      const result = await handler.handle(job)

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        estLaDerniereExecution: false,
        nbBeneficiairesNotifies: 2
      })
      expect(notificationRepository.send).to.have.callCount(2)
      expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
        dateExecution: maintenant.plus({ minute: 5 }).toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          typeNotification: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [Core.Structure.MILO],
          push: true,
          batchSize: 2,
          minutesEntreLesBatchs: 5,
          offset: 2,
          nbBeneficiairesNotifies: 2
        }
      })
    })

    describe("s'assure que les jobs suivants (batchs) ne tournent que les jours ouvrés entre 08h00 et 17h00 (Zone Europe/Paris)", async () => {
      it('après 17h00', async () => {
        // Given
        await ConseillerSqlModel.bulkCreate([
          unConseillerDto({
            id: 'con1'
          })
        ])
        await JeuneSqlModel.bulkCreate([
          unJeuneDto({
            id: 'j1',
            idConseiller: 'con1',
            pushNotificationToken: 'push1',
            structure: Core.Structure.MILO
          })
        ])

        const lundi17h12 = maintenant
          .setZone(TIME_ZONE_EUROPE_PARIS)
          .set({ localWeekday: 1, hour: 17, minute: 12 })
        dateService.now.returns(lundi17h12)

        const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
          dateExecution: lundi17h12.toJSDate(),
          type: JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            typeNotification: Notification.Type.OUTILS,
            titre: 'Une notification très importante',
            description: "C'est incroyable",
            structures: [Core.Structure.MILO],
            batchSize: 1,
            minutesEntreLesBatchs: 5
          }
        }

        // When
        const result = await handler.handle(job)

        // Then
        expect(result.succes).to.be.true()
        const mardi08h00 = maintenant
          .setZone(TIME_ZONE_EUROPE_PARIS)
          .set({ localWeekday: 2, hour: 8, minute: 0 })
        expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
          dateExecution: mardi08h00.toJSDate(),
          type: JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            typeNotification: Notification.Type.OUTILS,
            titre: 'Une notification très importante',
            description: "C'est incroyable",
            structures: [Core.Structure.MILO],
            batchSize: 1,
            minutesEntreLesBatchs: 5,
            offset: 1,
            nbBeneficiairesNotifies: 1
          }
        })
      })

      it('le dimanche', async () => {
        // Given
        await ConseillerSqlModel.bulkCreate([
          unConseillerDto({
            id: 'con1'
          })
        ])
        await JeuneSqlModel.bulkCreate([
          unJeuneDto({
            id: 'j1',
            idConseiller: 'con1',
            pushNotificationToken: 'push1',
            structure: Core.Structure.MILO
          })
        ])

        const dimancheMidi = maintenant
          .setZone(TIME_ZONE_EUROPE_PARIS)
          .set({ localWeekday: 7, hour: 12, minute: 0 })
        dateService.now.returns(dimancheMidi)

        const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
          dateExecution: dimancheMidi.toJSDate(),
          type: JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            typeNotification: Notification.Type.OUTILS,
            titre: 'Une notification très importante',
            description: "C'est incroyable",
            structures: [Core.Structure.MILO],
            batchSize: 1,
            minutesEntreLesBatchs: 5
          }
        }

        // When
        const result = await handler.handle(job)

        // Then
        expect(result.succes).to.be.true()
        const lundi08h00 = maintenant
          .setZone(TIME_ZONE_EUROPE_PARIS)
          .set({ localWeekday: 1, hour: 8, minute: 0 })
        expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
          dateExecution: lundi08h00.toJSDate(),
          type: JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            typeNotification: Notification.Type.OUTILS,
            titre: 'Une notification très importante',
            description: "C'est incroyable",
            structures: [Core.Structure.MILO],
            batchSize: 1,
            minutesEntreLesBatchs: 5,
            offset: 1,
            nbBeneficiairesNotifies: 1
          }
        })
      })

      it('le samedi après 17h00', async () => {
        // Given
        await ConseillerSqlModel.bulkCreate([
          unConseillerDto({
            id: 'con1'
          })
        ])
        await JeuneSqlModel.bulkCreate([
          unJeuneDto({
            id: 'j1',
            idConseiller: 'con1',
            pushNotificationToken: 'push1',
            structure: Core.Structure.MILO
          })
        ])

        const samedi20h00 = maintenant
          .setZone(TIME_ZONE_EUROPE_PARIS)
          .set({ localWeekday: 6, hour: 20, minute: 0 })
        dateService.now.returns(samedi20h00)

        const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
          dateExecution: samedi20h00.toJSDate(),
          type: JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            typeNotification: Notification.Type.OUTILS,
            titre: 'Une notification très importante',
            description: "C'est incroyable",
            structures: [Core.Structure.MILO],
            batchSize: 1,
            minutesEntreLesBatchs: 5
          }
        }

        // When
        const result = await handler.handle(job)

        // Then
        expect(result.succes).to.be.true()
        const lundi08h00 = maintenant
          .setZone(TIME_ZONE_EUROPE_PARIS)
          .set({ localWeekday: 1, hour: 8, minute: 0 })
        expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
          dateExecution: lundi08h00.toJSDate(),
          type: JobType.NOTIFIER_BENEFICIAIRES,
          contenu: {
            typeNotification: Notification.Type.OUTILS,
            titre: 'Une notification très importante',
            description: "C'est incroyable",
            structures: [Core.Structure.MILO],
            batchSize: 1,
            minutesEntreLesBatchs: 5,
            offset: 1,
            nbBeneficiairesNotifies: 1
          }
        })
      })
    })
  })
})
