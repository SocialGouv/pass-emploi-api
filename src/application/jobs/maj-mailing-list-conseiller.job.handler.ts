import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Job } from '../../building-blocks/types/job'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Core } from '../../domain/core'
import { Mail, MailRepositoryToken, MailServiceToken } from '../../domain/mail'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS)
export class MajMailingListConseillerJobHandler extends JobHandler<Job> {
  constructor(
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    @Inject(MailRepositoryToken)
    private mailRepository: Mail.Repository,
    private configuration: ConfigService,
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(
      Planificateur.JobType.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS,
      suiviJobService
    )
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    const stats: Partial<
      Record<Core.Structure | 'conseillersSansEmail', number>
    > = {}

    const suivi: SuiviJob = {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: false,
      dateExecution: maintenant,
      tempsExecution: 0,
      resultat: {}
    }

    const mailingLists: Record<Core.Structure, { id: string }> = {
      [Core.Structure.POLE_EMPLOI]: {
        id: this.configuration.get('brevo').mailingLists.poleEmploi
      },
      [Core.Structure.MILO]: {
        id: this.configuration.get('brevo').mailingLists.milo
      },
      [Core.Structure.POLE_EMPLOI_BRSA]: {
        id: this.configuration.get('brevo').mailingLists.brsa
      },
      [Core.Structure.POLE_EMPLOI_AIJ]: {
        id: this.configuration.get('brevo').mailingLists.aij
      },
      [Core.Structure.CONSEIL_DEPT]: {
        id: this.configuration.get('brevo').mailingLists.cd
      },
      [Core.Structure.AVENIR_PRO]: {
        id: this.configuration.get('brevo').mailingLists.avenirPro
      },
      [Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF]: {
        id: this.configuration.get('brevo').mailingLists.accompagnementIntensif
      },
      [Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL]: {
        id: this.configuration.get('brevo').mailingLists.accompagnementGlobal
      },
      [Core.Structure.FT_EQUIP_EMPLOI_RECRUT]: {
        id: this.configuration.get('brevo').mailingLists.equipEmploi
      }
    }

    Object.entries(mailingLists).forEach(async ([structure, mailingList]) => {
      const contacts =
        await this.mailRepository.findAllContactsConseillerByStructures([
          structure as Core.Structure
        ])
      stats[structure as Core.Structure] = contacts.length

      await this.mailService.mettreAJourMailingList(
        contacts,
        parseInt(mailingList.id)
      )
    })

    stats.conseillersSansEmail =
      await this.mailRepository.countContactsConseillerSansEmail()

    return {
      ...suivi,
      succes: true,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }
}
