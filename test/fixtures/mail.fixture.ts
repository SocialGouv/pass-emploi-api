import { MailDataDto } from 'src/domain/mail'

export const unMailDto = (args: Partial<MailDataDto> = {}): MailDataDto => {
  const defaults = {
    to: [
      {
        email: 'nils.tavernier@passemploi.com',
        name: 'Nils  Tavernier'
      }
    ],
    templateId: 1,
    params: {
      prenom: 'Nils',
      conversationsNonLues: 22,
      nom: 'Tavernier',
      lien: ''
    },
    attachment: [
      {
        name: 'invite.ics',
        content: ''
      }
    ]
  }

  return { ...defaults, ...args }
}
