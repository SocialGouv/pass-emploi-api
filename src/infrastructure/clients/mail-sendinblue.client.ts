import { Injectable, Logger } from '@nestjs/common'
import { Conseiller } from '../../domain/conseiller'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MailSendinblueClient {
  private sendinblueUrl: string
  private apiKey: string
  private templateId: string
  private frontendUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.sendinblueUrl = this.configService.get('sendinblue').url
    this.apiKey = this.configService.get('sendinblue').apiKey
    this.templateId = this.configService.get('sendinblue').templateId
    this.frontendUrl = this.configService.get('frontEndUrl') ?? ''
    this.logger = new Logger('MailSendinblueClient')
  }

  async envoyer(
    conseiller: Conseiller,
    nombreDeConversationNonLues: number
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.sendinblueUrl}/v3/smtp/email`,
          {
            to: [
              {
                email: conseiller.email,
                name: `${conseiller.firstName} ${conseiller.lastName}`
              }
            ],
            templateId: parseInt(this.templateId),
            params: {
              prenom: conseiller.firstName,
              conversationsNonLues: nombreDeConversationNonLues,
              nom: conseiller.lastName,
              lien: this.frontendUrl
            }
          },
          {
            headers: {
              'api-key': `${this.apiKey}`,
              accept: 'application/json',
              'content-type': 'application/json'
            }
          }
        )
      )
    } catch (e) {
      this.logger.error(e)
    }
  }
}
