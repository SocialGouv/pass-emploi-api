import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  emptySuccess,
  Result,
  success
} from '../../../building-blocks/types/result'
import {
  NotificationSupport,
  NotificationSupportServiceToken
} from '../../../domain/notification-support'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Core } from '../../../domain/core'
import {
  Mail,
  MailRepositoryToken,
  MailServiceToken
} from '../../../domain/mail'
import { DateService } from '../../../utils/date-service'

@Injectable()
export class HandleJobUpdateMailingListConseillerCommandHandler extends CommandHandler<
  Command,
  Stats
> {
  private mailingLists: { poleEmploi: string; milo: string }

  constructor(
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    @Inject(MailRepositoryToken)
    private mailRepository: Mail.Repository,
    private configuration: ConfigService,
    private dateService: DateService,
    @Inject(NotificationSupportServiceToken)
    notificationSupportService: NotificationSupport.Service
  ) {
    super(
      'HandleJobUpdateMailingListConseillerCommandHandler',
      notificationSupportService
    )
    this.mailingLists = this.configuration.get('sendinblue').mailingLists
  }

  async handle(): Promise<Result<Stats>> {
    const maintenant = this.dateService.now()

    const contactsMilo =
      await this.mailRepository.findAllContactsConseillerByStructure(
        Core.Structure.MILO
      )
    const contactsPoleEmploi =
      await this.mailRepository.findAllContactsConseillerByStructure(
        Core.Structure.POLE_EMPLOI
      )
    await this.mailService.mettreAJourMailingList(
      contactsMilo,
      parseInt(this.mailingLists.milo)
    )
    await this.mailService.mettreAJourMailingList(
      contactsPoleEmploi,
      parseInt(this.mailingLists.poleEmploi)
    )
    const conseillersSansEmail =
      await this.mailRepository.countContactsConseillerSansEmail()
    const stats: Stats = {
      conseillersMilo: contactsMilo.length,
      conseillersPoleEmploi: contactsPoleEmploi.length,
      conseillersSansEmail,
      tempsDExecution: maintenant.diffNow().milliseconds * -1
    }
    return success(stats)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

interface Stats {
  conseillersMilo: number
  conseillersPoleEmploi: number
  conseillersSansEmail: number
  tempsDExecution?: number
}
