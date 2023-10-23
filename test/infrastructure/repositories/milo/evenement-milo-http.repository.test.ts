import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { unEvenementMilo, unEvenementMiloDto } from 'test/fixtures/milo.fixture'
import { expect } from 'test/utils'
import { testConfig } from 'test/utils/module-for-testing'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../../src/building-blocks/types/result'
import { EvenementMilo } from '../../../../src/domain/milo/evenement.milo'
import { EvenementMiloHttpRepository } from '../../../../src/infrastructure/repositories/milo/evenement-milo-http.repository'
import { RateLimiterService } from '../../../../src/utils/rate-limiter.service'

describe('MiloEvenementsHttpRepository', () => {
  let repository: EvenementMiloHttpRepository
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  beforeEach(async () => {
    const httpService = new HttpService()
    repository = new EvenementMiloHttpRepository(
      httpService,
      configService,
      rateLimiterService
    )
  })
  describe('findAllEvenements', () => {
    it("doit retourner une liste d'évènements", async () => {
      // Given
      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(200, [unEvenementMiloDto()])
        .isDone()

      // When
      const evenements = await repository.findAllEvenements()

      // Then
      expect(evenements).to.deep.equal([unEvenementMilo()])
    })
    it('renvoie une erreur HTTP quand il y a un problème HTTP', async () => {
      // Given
      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(400, 'Bad Request')
        .isDone()

      // When
      const promise = repository.findAllEvenements()

      // Then
      await expect(promise).to.be.rejected()
    })
    it('mappe les éléments de format inconnus en non traitable', async () => {
      // Given
      const unEvenementInconnuDto = unEvenementMiloDto({
        type: 'PLOP'
      })
      const unEvenementMiloInconnue = unEvenementMilo({
        objet: EvenementMilo.ObjetEvenement.NON_TRAITABLE
      })

      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(200, [unEvenementMiloDto(), unEvenementInconnuDto])
        .isDone()

      // When
      const evenements = await repository.findAllEvenements()

      // Then
      expect(evenements).to.deep.equal([
        unEvenementMilo(),
        unEvenementMiloInconnue
      ])
    })
  })
  describe('acquitterEvenement', () => {
    let evenement: EvenementMilo

    beforeEach(() => {
      evenement = unEvenementMilo()
    })

    it('acquitte l‘evenement quand milo répond NO CONTENT', async () => {
      // Given
      nock('https://milo.com')
        .post(`/operateurs/events/${evenement.id}/ack`, {})
        .reply(204)

      // When
      const result = await repository.acquitterEvenement(evenement)

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('retourne une failure quand milo répond INTERNAL SERVER ERROR', async () => {
      // Given
      nock('https://milo.com')
        .post(`/operateurs/events/${evenement.id}/ack`, {})
        .reply(500, 'Im not a teapot')

      // When
      const result = await repository.acquitterEvenement(evenement)

      // Then
      expect(result).to.deep.equal(
        failure(new ErreurHttp('Im not a teapot', 500))
      )
    })
  })
})
