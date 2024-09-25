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
  private mailingLists: {
    poleEmploi: string
    milo: string
    brsa: string
    aij: string
    cd: string
  }

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
    this.mailingLists = this.configuration.get('brevo').mailingLists
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    const suivi: SuiviJob = {
      jobType: this.jobType,
      nbErreurs: 0,
      succes: false,
      dateExecution: maintenant,
      tempsExecution: 0,
      resultat: {}
    }

    const contactsMilo =
      await this.mailRepository.findAllContactsConseillerByStructures([
        Core.Structure.MILO
      ])
    const contactsPoleEmploi =
      await this.mailRepository.findAllContactsConseillerByStructures([
        Core.Structure.POLE_EMPLOI
      ])
    const contactsBRSA =
      await this.mailRepository.findAllContactsConseillerByStructures([
        Core.Structure.POLE_EMPLOI_BRSA
      ])
    const contactsAIJ =
      await this.mailRepository.findAllContactsConseillerByStructures([
        Core.Structure.POLE_EMPLOI_AIJ
      ])
    const contactsCD =
      await this.mailRepository.findAllContactsConseillerByStructures([
        Core.Structure.CONSEIL_DEPT
      ])
    await this.mailService.mettreAJourMailingList(
      contactsMilo,
      parseInt(this.mailingLists.milo)
    )
    await this.mailService.mettreAJourMailingList(
      contactsPoleEmploi,
      parseInt(this.mailingLists.poleEmploi)
    )
    await this.mailService.mettreAJourMailingList(
      contactsBRSA,
      parseInt(this.mailingLists.brsa)
    )
    await this.mailService.mettreAJourMailingList(
      contactsCD,
      parseInt(this.mailingLists.cd)
    )
    const conseillersSansEmail =
      await this.mailRepository.countContactsConseillerSansEmail()
    const stats = {
      conseillersMilo: contactsMilo.length,
      conseillersPoleEmploi: contactsPoleEmploi.length,
      conseillersBRSA: contactsBRSA.length,
      conseillersAIJ: contactsAIJ.length,
      conseillersSansEmail
    }
    return {
      ...suivi,
      succes: true,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: stats
    }
  }
}
