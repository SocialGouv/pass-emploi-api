import { Injectable } from '@nestjs/common'
import { Conseiller } from '../../domain/conseiller'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { ConfigService } from '@nestjs/config'
import {
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../domain/rendez-vous'
import { Mail, MailDataDto } from '../../domain/mail'
import { InvitationIcsClient } from './invitation-ics.client'

export type ICS = string

@Injectable()
export class MailSendinblueClient implements Mail.Client {
  private sendinblueUrl: string
  private apiKey: string
  private templates: { conversationsNonLues: string; nouveauRendezvous: string }
  private frontendUrl: string

  constructor(
    private invitationIcsClient: InvitationIcsClient,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.sendinblueUrl = this.configService.get('sendinblue').url
    this.apiKey = this.configService.get('sendinblue').apiKey
    this.templates = this.configService.get('sendinblue').templates
    this.frontendUrl = this.configService.get('frontEndUrl') ?? ''
  }

  async envoyerMailConversationsNonLues(
    conseiller: Conseiller,
    nombreDeConversationNonLues: number
  ): Promise<void> {
    const mailDataDto: MailDataDto = {
      to: [
        {
          email: conseiller.email!,
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
    await this.postMail(mailDataDto)
  }

  async envoyerMailNouveauRendezVous(
    conseiller: Conseiller,
    rendezVous: RendezVous
  ): Promise<void> {
    const rendezVousIcsSequence =
      await this.invitationIcsClient.getAndIncrementRendezVousIcsSequence(
        rendezVous.id
      )
    const fichierInvitation =
      this.invitationIcsClient.creerFichierInvitationNouveauRendezVous(
        conseiller,
        rendezVous,
        rendezVousIcsSequence
      )
    const mailDatadto = this.creerContenuMailNouveauRendezVous(
      conseiller,
      rendezVous,
      fichierInvitation
    )

    await this.postMail(mailDatadto)
  }

  creerContenuMailNouveauRendezVous(
    conseiller: Conseiller,
    rendezVous: RendezVous,
    fichierInvitation: ICS
  ): MailDataDto {
    const invitationBase64 = Buffer.from(fichierInvitation).toString('base64')
    return {
      to: [
        {
          email: conseiller.email!,
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
      templateId: parseInt(this.templates.nouveauRendezvous)
    }
  }

  async postMail(data: MailDataDto): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`${this.sendinblueUrl}/v3/smtp/email`, data, {
        headers: {
          'api-key': `${this.apiKey}`,
          accept: 'application/json',
          'content-type': 'application/json'
        }
      })
    )
  }
}

export function formaterDateRendezVous(rendezVousDate: Date): string {
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }
  return rendezVousDate.toLocaleString('fr-FR', dateOptions)
}

export function formaterHeureRendezVous(rendezVousDate: Date): string {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }
  return rendezVousDate.toLocaleString('fr-FR', timeOptions).replace(':', 'h')
}
