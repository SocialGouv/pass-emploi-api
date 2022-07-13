import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { Result, success } from 'src/building-blocks/types/result'
import { NotificationSupportMattermostService } from 'src/infrastructure/clients/mattermost-notification-support.service'
import { testConfig } from '../../utils/module-for-testing'

describe('NotificationSupportMattermostService', () => {
  let service: NotificationSupportMattermostService
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    service = new NotificationSupportMattermostService(
      configService,
      httpService
    )
  })

  describe('notifierResultatJob', () => {
    it('envoie une notif de succès quand le result est success', async () => {
      // Given
      const infosJob = {
        job: 'handleJob',
        result: success({ unChamp: 'present' }) as unknown as Result
      }
      const body = {
        username: 'CEJ Lama',
        text: '{"username":"CEJ Lama","text":"### Résultat du job _handleJob_\\n| Statut | :white_check_mark: |\\n    |:------------------------|:-------------|\\n    | unChamp | present |"}'
      }

      nock(configService.get('mattermost').jobWebhookUrl)
        .post('/get-immersion-by-id/plop', body)
        .reply(200)
        .isDone()

      // When
      const call = await service.notifierResultatJob(infosJob)

      // Then
      expect(call).to.be.fulfilled()
    })
  })
})
