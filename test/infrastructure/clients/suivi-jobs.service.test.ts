import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { SuiviJobsService } from 'src/infrastructure/clients/suivi-jobs.service'
import { testConfig } from '../../utils/module-for-testing'
import { ResultatJob } from '../../../src/domain/suivi-jobs'

describe('SuiviJobsService', () => {
  let service: SuiviJobsService
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    service = new SuiviJobsService(configService, httpService)
  })

  describe('notifierResultatJob', () => {
    it('envoie une notif de succès quand le result est success', async () => {
      // Given
      const infosJob: ResultatJob = {
        jobCommand: 'handleJob',
        result: success({ unChamp: 'present' }) as unknown as Result
      }
      const stringBody =
        '{"username":"CEJ Lama","text":"### Résultat du job _handleJob_\\n| Statut | :white_check_mark: |\\n    |:------------------------|:-------------|\\n    | unChamp | present |"}'

      const scope = nock(configService.get('mattermost').jobWebhookUrl)
        .post('', stringBody)
        .reply(200)

      // When
      await service.notifierResultatJob(infosJob)

      // Then
      expect(scope.isDone()).to.equal(true)
    })
    it("envoie une notif d'erreur quand le result est error", async () => {
      // Given
      const infosJob: ResultatJob = {
        jobCommand: 'handleJob',
        result: failure(new NonTrouveError('test', '1')) as unknown as Result
      }
      const stringBody =
        '{"username":"CEJ Lama","text":"### Résultat du job _handleJob_\\n| Statut | :x: |\\n    |:------------------|:----|\\n    | code | NON_TROUVE |\\n| message | test 1 non trouvé(e) |"}'

      const scope = nock(configService.get('mattermost').jobWebhookUrl)
        .post('', stringBody)
        .reply(200)

      // When
      await service.notifierResultatJob(infosJob)

      // Then
      expect(scope.isDone()).to.equal(true)
    })
  })
})
