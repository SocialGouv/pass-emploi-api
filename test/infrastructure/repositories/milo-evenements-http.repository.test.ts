import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import {
  unEvenementMiloDto,
  unEvenementMilo
} from 'test/fixtures/partenaire.fixture'
import { expect } from 'test/utils'
import { testConfig } from 'test/utils/module-for-testing'
import { MiloEvenementsHttpRepository } from '../../../src/infrastructure/repositories/milo-evenements-http.repository'
import { Milo } from '../../../src/domain/partenaire/milo'
import ObjetEvenement = Milo.ObjetEvenement
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { Partenaire } from '../../../src/domain/partenaire/partenaire'

describe('MiloEvenementsHttpRepository', () => {
  let miloEvenementsHttpRepository: MiloEvenementsHttpRepository
  const configService = testConfig()

  beforeEach(async () => {
    const httpService = new HttpService()
    miloEvenementsHttpRepository = new MiloEvenementsHttpRepository(
      httpService,
      configService
    )
  })
  describe('findAllEvenements', () => {
    it("doit retourner une liste d'évènements", async () => {
      // Given
      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(200, JSON.stringify([unEvenementMiloDto()]))
        .isDone()

      // When
      const evenements = await miloEvenementsHttpRepository.findAllEvenements()

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
      const promise = miloEvenementsHttpRepository.findAllEvenements()

      // Then
      await expect(promise).to.be.rejected()
    })
    it('mappe les éléments de format inconnus en non traitable', async () => {
      // Given
      const unEvenementInconnuDto = unEvenementMiloDto({
        type: 'PLOP'
      })
      const unEvenementMiloInconnue = unEvenementMilo({
        objet: ObjetEvenement.NON_TRAITABLE
      })

      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(
          200,
          JSON.stringify([unEvenementMiloDto(), unEvenementInconnuDto])
        )
        .isDone()

      // When
      const evenements = await miloEvenementsHttpRepository.findAllEvenements()

      // Then
      expect(evenements).to.deep.equal([
        unEvenementMilo(),
        unEvenementMiloInconnue
      ])
    })
  })
  describe('acquitterEvenement', () => {
    let evenement: Partenaire.Milo.Evenement

    beforeEach(() => {
      evenement = unEvenementMilo()
    })

    it('acquitte l‘evenement quand milo répond NO CONTENT', async () => {
      // Given
      nock('https://milo.com')
        .post(`/operateurs/events/${evenement.id}/ack`, {})
        .reply(204)

      // When
      const result = await miloEvenementsHttpRepository.acquitterEvenement(
        evenement
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('retourne une failure quand milo répond INTERNAL SERVER ERROR', async () => {
      // Given
      nock('https://milo.com')
        .post(`/operateurs/events/${evenement.id}/ack`, {})
        .reply(500, 'Im not a teapot')

      // When
      const result = await miloEvenementsHttpRepository.acquitterEvenement(
        evenement
      )

      // Then
      expect(result).to.deep.equal(
        failure(new ErreurHttp('Im not a teapot', 500))
      )
    })
  })
})
