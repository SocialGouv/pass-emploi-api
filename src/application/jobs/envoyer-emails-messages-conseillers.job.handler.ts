import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Job } from 'bull'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillerRepositoryToken } from '../../domain/conseiller'
import { Mail, MailServiceToken } from '../../domain/mail'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'
import { buildError } from '../../utils/logger.module'

@Injectable()
@ProcessJobType(Planificateur.JobType.MAIL_CONSEILLER_MESSAGES)
export class EnvoyerEmailsMessagesConseillersJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    private dateService: DateService,
    private configuration: ConfigService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.MAIL_CONSEILLER_MESSAGES, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    let erreur = undefined
    const stats = {
      succes: 0,
      mailsEnvoyes: 0
    }
    let nbErreurs = 0
    let succes = false

    let conseillers = []
    const maintenant = this.dateService.now()
    const nombreConseillers = parseInt(
      this.configuration.get(
        'jobs.mailConseillers.nombreDeConseillersEnParallele'
      )!
    )

    try {
      do {
        conseillers =
          await this.conseillerRepository.findConseillersMessagesNonVerifies(
            nombreConseillers,
            maintenant
          )

        await Promise.all(
          conseillers.map(async conseiller => {
            try {
              const nombreDeConversationsNonLues =
                await this.chatRepository.getNombreDeConversationsNonLues(
                  conseiller.id
                )

              if (nombreDeConversationsNonLues !== 0) {
                try {
                  await this.mailService.envoyerMailConversationsNonLues(
                    conseiller,
                    nombreDeConversationsNonLues
                  )
                  stats.mailsEnvoyes++
                } catch (e) {
                  this.logger.error(
                    buildError(
                      "Erreur lors de l'envoi de l'email des conversations non lues",
                      e
                    )
                  )
                }
              }

              await this.conseillerRepository.updateDateVerificationMessages(
                conseiller.id,
                maintenant.toJSDate()
              )
              stats.succes++
            } catch (e) {
              this.logger.error(
                `Echec verification des messages non lus du conseiller ${conseiller.id}`
              )
              nbErreurs++
            }
          })
        )
      } while (conseillers.length && nbErreurs < 500)
      succes = true
    } catch (e) {
      this.logger.error("Le job des mails des messages non lus s'est arrêté")
      this.logger.log(stats)
      succes = false
      erreur = e
    }

    return {
      jobType: this.jobType,
      nbErreurs,
      succes,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: erreur ?? stats,
      erreur
    }
  }
}
