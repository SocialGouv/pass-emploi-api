import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Result, success } from 'src/building-blocks/types/result'
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
    private dateService: DateService
  ) {
    super('HandleJobUpdateMailingListConseillerCommandHandler')
    this.mailingLists = this.configuration.get('sendinblue').mailingLists
  }

  async handle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<Result<Stats>> {
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

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<void> {
    return
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
