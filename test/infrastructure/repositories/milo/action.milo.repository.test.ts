import { testConfig } from '../../../utils/module-for-testing'
import { HttpService } from '@nestjs/axios'
import { ActionMiloHttpRepository } from '../../../../src/infrastructure/repositories/milo/action.milo.repository'
import { expect } from '../../../utils'
import { uneActionMilo } from '../../../fixtures/action.fixture'
import {
  emptySuccess,
  failure
} from '../../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import * as nock from 'nock'
import { RateLimiterService } from '../../../../src/utils/rate-limiter.service'

describe('MiloHttpSqlRepository', () => {
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  let repository: ActionMiloHttpRepository

  beforeEach(() => {
    const httpService = new HttpService()
    repository = new ActionMiloHttpRepository(
      httpService,
      configService,
      rateLimiterService
    )
  })

  describe('save', () => {
    describe('quand Milo renvoie une erreur', () => {
      it('renvoie une failure', async () => {
        // Given
        nock('https://milo.com')
          .post('/sue/dossiers/idDossier/situation')
          .reply(404, {
            message: 'un message'
          })
          .isDone()

        // When
        const result = await repository.save(
          uneActionMilo({ idJeune: 'id-jeune-avec-id-dossier' })
        )

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('un message', 404)))
      })
    })

    describe('quand Milo est up and ready', () => {
      it('crée une SNP', async () => {
        // Given
        nock('https://milo.com')
          .post('/sue/dossiers/idDossier/situation', {
            dateDebut: '2022-03-01',
            dateFinReelle: '2022-03-01',
            commentaire: 'Un commentaire',
            mesure: 'SANTE',
            loginConseiller: 'loginConseiller'
          })
          .reply(201)
          .isDone()

        // When
        const result = await repository.save(
          uneActionMilo({ idJeune: 'id-jeune-avec-id-dossier' })
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
