import { Conseiller } from '../../domain/conseiller'
import { RendezVous } from '../../domain/rendez-vous'
import { ICS, MailDataDto } from './mail-sendinblue.client'

export interface MailClient {
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
