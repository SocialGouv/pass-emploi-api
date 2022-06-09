import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Chat, ChatRepositoryToken } from '../../../domain/chat'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../../domain/conseiller'
import { Mail, MailServiceToken } from '../../../domain/mail'
import { buildError } from '../../../utils/logger.module'

@Injectable()
export class HandleJobMailConseillerCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    private dateService: DateService,
    private configuration: ConfigService
  ) {
    super('HandleJobMailConseillerCommandHandler')
  }

  async handle(): Promise<Result<Stats>> {
    const stats: Stats = {
      succes: 0,
      echecs: 0,
      mailsEnvoyes: 0
    }

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
                if (!conseiller?.email) {
                  this.logger.warn(
                    `Impossible d'envoyer un mail au conseiller ${conseiller.id}, il n'existe pas`
                  )
                } else {
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
              stats.echecs++
            }
          })
        )
      } while (conseillers.length)

      stats.tempsDExecution = maintenant.diffNow().milliseconds * -1
      return success(stats)
    } catch (e) {
      this.logger.error("Le job des mails des messages non lus s'est arrêté")
      this.logger.log(stats)
      return failure(e)
    }
  }

  async authorize(): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  succes: number
  echecs: number
  mailsEnvoyes: number
  tempsDExecution?: number
}
