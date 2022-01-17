import { MailSendinblueClient } from '../../../src/infrastructure/clients/mail-sendinblue.client'
import { HttpService } from '@nestjs/axios'
import { testConfig } from '../../utils/module-for-testing'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import * as nock from 'nock'
import { expect } from '../../utils'

describe('MailSendinblueClient', () => {
  let mailSendinblueClient: MailSendinblueClient
  const config = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    mailSendinblueClient = new MailSendinblueClient(httpService, config)
  })

  describe('envoyer', () => {
    describe('quand tout va bien', () => {
      it('envoie un mail', async () => {
        // Given
        const conseiller = unConseiller()
        const expectBody = {
          to: [
            {
              email: conseiller.email,
              name: conseiller.firstName + ' ' + conseiller.lastName
            }
          ],
          templateId: parseInt(config.get('sendinblue').templateId),
          params: {
            prenom: conseiller.firstName,
            conversationsNonLues: 22,
            nom: conseiller.lastName,
            lien: config.get('frontEndUrl')
          }
        }
        const scope = nock(config.get('sendinblue').url)
          .post('/v3/smtp/email', JSON.stringify(expectBody))
          .reply(200)

        // When
        await mailSendinblueClient.envoyer(conseiller, 22)

        // Then
        expect(scope.isDone()).to.equal(true)
      })
    })
  })
})
