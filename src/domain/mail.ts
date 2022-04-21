import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ICS } from '../infrastructure/clients/mail-sendinblue.service'
import { Conseiller } from './conseiller'
import { Core } from './core'
import { Jeune } from './jeune'
import { RendezVous } from './rendez-vous'

export const MailServiceToken = 'MailServiceToken'
export const MailRepositoryToken = 'MailRepositoryToken'

export interface MailDataDto {
  to: RecipientDto[]
  templateId: number
  // eslint-disable-next-line @typescript-eslint/ban-types
  params?: Object
  attachment?: AttachmentDto[]
}

interface RecipientDto {
  email: string
  name: string
}

interface AttachmentDto {
  name: string
  content: string
}

export namespace Mail {
  export interface Contact {
    email: string
    nom: string
    prenom: string
  }

  export interface Service {
    envoyerMailConversationsNonLues(
      conseiller: Conseiller,
      nombreDeConversationNonLues: number
    ): Promise<void>

    envoyerMailRendezVous(
      conseiller: Conseiller,
      rendezVous: RendezVous
    ): Promise<void>

    envoyer(data: MailDataDto): Promise<void>

    creerContenuMailNouveauRendezVous(
      conseiller: Conseiller,
      rendezVous: RendezVous,
      fichierInvitation: ICS
    ): MailDataDto

    mettreAJourMailingList(
      contacts: Contact[],
      mailingListId: number
    ): Promise<void>
  }

  export interface Repository {
    findAllContactsConseillerByStructure(
      structure: Core.Structure
    ): Promise<Mail.Contact[]>

    countContactsConseillerSansEmail(): Promise<number>
  }

  @Injectable()
  export class Factory {
    private templates: {
      conversationsNonLues: string
      nouveauRendezvous: string
      suppressionJeuneMilo: string
      suppressionJeunePE: string
    }

    constructor(private configService: ConfigService) {
      this.templates = this.configService.get('sendinblue').templates
    }

    creerMailSuppressionJeune(
      conseiller: Conseiller,
      jeune: Jeune
    ): MailDataDto {
      let templateId: number

      if (conseiller.structure === Core.Structure.POLE_EMPLOI) {
        templateId = parseInt(this.templates.suppressionJeunePE)
      } else {
        templateId = parseInt(this.templates.suppressionJeuneMilo)
      }

      return {
        to: [
          {
            email: conseiller.email!,
            name: `${conseiller.firstName} ${conseiller.lastName}`
          }
        ],
        templateId,
        params: {
          prenom: jeune.firstName,
          nom: jeune.lastName
        }
      }
    }
  }
}
