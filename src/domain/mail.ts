import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Conseiller } from './conseiller/conseiller'
import { Core } from './core'
import { Jeune } from './jeune/jeune'
import { RendezVous } from './rendez-vous/rendez-vous'
import { ArchiveJeune } from './archive-jeune'

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
    envoyer(data: MailDataDto): Promise<void>

    envoyerMailConversationsNonLues(
      conseiller: Conseiller,
      nombreDeConversationNonLues: number
    ): Promise<void>

    envoyerMailRendezVous(
      conseiller: Conseiller,
      rendezVous: RendezVous,
      operation: RendezVous.Operation
    ): Promise<void>

    envoyerEmailJeuneArchive(
      jeune: Jeune,
      motif:
        | ArchiveJeune.MotifSuppression
        | ArchiveJeune.MotifSuppressionSupport,
      commentaire?: string
    ): Promise<void>

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
      rendezVousSupprime: string
      suppressionJeuneMilo: string
      suppressionJeunePE: string
    }

    constructor(private configService: ConfigService) {
      this.templates = this.configService.get('sendinblue').templates
    }

    creerMailSuppressionJeune(jeune: Jeune): MailDataDto {
      let templateId: number

      if (!jeune.conseiller) {
        throw new Error(`Le jeune ${jeune.id} n'a pas de conseiller`)
      }

      if (Core.structuresPoleEmploiBRSA.includes(jeune.structure)) {
        templateId = parseInt(this.templates.suppressionJeunePE)
      } else {
        templateId = parseInt(this.templates.suppressionJeuneMilo)
      }

      return {
        to: [
          {
            email: jeune.conseiller.email!,
            name: `${jeune.conseiller.firstName} ${jeune.conseiller.lastName}`
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
