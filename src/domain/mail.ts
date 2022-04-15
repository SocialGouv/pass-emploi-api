import { Conseiller } from './conseiller'
import { RendezVous } from './rendez-vous'
import { ICS } from '../infrastructure/clients/mail-sendinblue.client'
import { Injectable } from '@nestjs/common'
import { Jeune } from './jeune'
import { Core } from './core'
import { ConfigService } from '@nestjs/config'

export const MailClientToken = 'MailClientToken'

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
  export interface Client {
    envoyerMailConversationsNonLues(
      conseiller: Conseiller,
      nombreDeConversationNonLues: number
    ): Promise<void>

    envoyerMailNouveauRendezVous(
      conseiller: Conseiller,
      rendezVous: RendezVous
    ): Promise<void>

    postMail(data: MailDataDto): Promise<void>

    creerContenuMailNouveauRendezVous(
      conseiller: Conseiller,
      rendezVous: RendezVous,
      fichierInvitation: ICS
    ): MailDataDto
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
