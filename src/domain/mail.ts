import { Conseiller } from './conseiller'
import { RendezVous } from './rendez-vous'
import { ICS } from '../infrastructure/clients/mail-sendinblue.client'

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
}
