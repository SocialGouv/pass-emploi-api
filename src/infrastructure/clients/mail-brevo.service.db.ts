import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Conseiller } from '../../domain/milo/conseiller'
import { Mail, MailDataDto } from '../../domain/mail'
import {
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../domain/rendez-vous/rendez-vous'
import { InvitationIcsClient } from './invitation-ics.client'
import { Jeune } from '../../domain/jeune/jeune'
import { ArchiveJeune } from '../../domain/archive-jeune'
import { Authentification } from '../../domain/authentification'

export type ICS = string

@Injectable()
export class MailBrevoService implements Mail.Service {
  private readonly brevoUrl: string
  private readonly apiKey: string
  private templates: {
    conversationsNonLues: string
    nouveauRendezvous: string
    rappelRendezvous: string
    rendezVousSupprime: string
    compteJeuneArchive: string
    creationConseillerMilo: string
  }
  private readonly frontendUrl: string
  private logger: Logger

  constructor(
    private invitationIcsClient: InvitationIcsClient,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.brevoUrl = this.configService.get('brevo').url
    this.apiKey = this.configService.get('brevo').apiKey
    this.templates = this.configService.get('brevo').templates
    this.frontendUrl = this.configService.get('frontEndUrl') ?? ''
    this.logger = new Logger('MailBrevoService')
  }

  async envoyer(data: MailDataDto): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.brevoUrl}/v3/smtp/email`, data, {
          headers: {
            'api-key': `${this.apiKey}`,
            accept: 'application/json',
            'content-type': 'application/json'
          }
        })
      )
    } catch (e) {
      this.logger.error(e)
    }
  }

  async envoyerMailConversationsNonLues(
    conseiller: Conseiller,
    nombreDeConversationNonLues: number
  ): Promise<void> {
    const mailDataDto: MailDataDto = {
      to: [
        {
          email: conseiller.email!.replace(/pole-emploi/g, 'francetravail'),
          name: `${conseiller.firstName} ${conseiller.lastName}`
        }
      ],
      templateId: parseInt(this.templates.conversationsNonLues),
      params: {
        prenom: conseiller.firstName,
        conversationsNonLues: nombreDeConversationNonLues,
        nom: conseiller.lastName,
        lien: this.frontendUrl
      }
    }
    await this.envoyer(mailDataDto)
  }

  async envoyerEmailCreationConseillerMilo(
    utilisateurConseiller: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateurConseiller.email) {
      const mailDataDto: MailDataDto = {
        to: [
          {
            email: utilisateurConseiller.email,
            name: `${utilisateurConseiller.prenom} ${utilisateurConseiller.nom}`
          }
        ],
        templateId: parseInt(this.templates.creationConseillerMilo),
        params: {
          prenom: utilisateurConseiller.prenom
        }
      }
      await this.envoyer(mailDataDto)
    }
  }

  async envoyerMailRendezVous(
    conseiller: Conseiller,
    rendezVous: RendezVous,
    operation: RendezVous.Operation
  ): Promise<void> {
    const rendezVousIcsSequence =
      await this.invitationIcsClient.getAndIncrementRendezVousIcsSequence(
        rendezVous.id
      )
    const fichierInvitation =
      this.invitationIcsClient.creerFichierInvitationRendezVous(
        conseiller,
        rendezVous,
        rendezVousIcsSequence,
        operation
      )
    const mailDatadto = this.creerContenuMailRendezVous(
      conseiller,
      rendezVous,
      fichierInvitation,
      operation
    )
    await this.envoyer(mailDatadto)
  }

  async envoyerEmailJeuneArchive(
    jeune: Jeune,
    motif: ArchiveJeune.MotifSuppression | ArchiveJeune.MotifSuppressionSupport,
    commentaire?: string
  ): Promise<void> {
    const mailDataDto: MailDataDto = {
      to: [
        {
          email: jeune.email!,
          name: `${jeune.firstName} ${jeune.lastName}`
        }
      ],
      templateId: parseInt(this.templates.compteJeuneArchive),
      params: {
        prenom: jeune.firstName,
        nom: jeune.lastName,
        motif,
        commentaireMotif: commentaire
      }
    }
    await this.envoyer(mailDataDto)
  }

  async mettreAJourMailingList(
    contacts: Mail.Contact[],
    mailingListId: number
  ): Promise<void> {
    const contactsDTO: Brevo.Contact[] = contacts.map(contact => ({
      email: contact.email,
      attributes: {
        nom: contact.nom,
        prenom: contact.prenom
      }
    }))
    const payload = {
      listIds: [mailingListId],
      emailBlacklist: false,
      smsBlacklist: false,
      updateExistingContacts: true,
      emptyContactsAttributes: false,
      jsonBody: contactsDTO
    }
    try {
      await firstValueFrom(
        this.httpService.post(`${this.brevoUrl}/v3/contacts/import`, payload, {
          headers: {
            'api-key': `${this.apiKey}`,
            accept: 'application/json',
            'content-type': 'application/json'
          }
        })
      )
    } catch (e) {
      if (e.name === 'AxiosError') {
        e.config.data = 'REDACTED'
        e.config.headers['api-key'] = 'REDACTED'
      }
      throw e
    }
  }

  creerContenuMailRendezVous(
    conseiller: Conseiller,
    rendezVous: RendezVous,
    fichierInvitation: ICS,
    operation: RendezVous.Operation
  ): MailDataDto {
    const invitationBase64 = Buffer.from(fichierInvitation).toString('base64')
    const templateId = this.fromOperationToTemplateId(operation)
    return {
      to: [
        {
          email: conseiller.email!.replace(/pole-emploi/g, 'francetravail'),
          name: conseiller.firstName + ' ' + conseiller.lastName
        }
      ],
      params: {
        typeRdv: mapCodeLabelTypeRendezVous[rendezVous.type],
        dateRdv: formaterDateRendezVous(rendezVous.date),
        heureRdv: formaterHeureRendezVous(rendezVous.date),
        lienPortail: this.frontendUrl
      },
      attachment: [
        {
          name: 'invite.ics',
          content: invitationBase64
        }
      ],
      templateId
    }
  }

  private fromOperationToTemplateId(operation: RendezVous.Operation): number {
    switch (operation) {
      case RendezVous.Operation.CREATION: {
        return parseInt(this.templates.nouveauRendezvous)
      }
      case RendezVous.Operation.MODIFICATION: {
        return parseInt(this.templates.rappelRendezvous)
      }
      case RendezVous.Operation.SUPPRESSION: {
        return parseInt(this.templates.rendezVousSupprime)
      }
    }
  }
}

export namespace Brevo {
  export interface Contact {
    email: string
    attributes: AttributesContact
  }

  export interface AttributesContact {
    nom: string
    prenom: string
  }
}

export function formaterDateRendezVous(rendezVousDate: Date): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris'
  }
  return rendezVousDate.toLocaleString('fr-FR', dateOptions)
}

export function formaterHeureRendezVous(rendezVousDate: Date): string {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Paris'
  }
  return rendezVousDate.toLocaleString('fr-FR', timeOptions).replace(':', 'h')
}
