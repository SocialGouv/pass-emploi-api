import { SinonSandbox } from 'sinon'
import {
  GetEvenementEmploiQuery,
  GetEvenementEmploiQueryHandler
} from 'src/application/queries/get-evenement-emploi.query.handler'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import { success } from '../../../src/building-blocks/types/result'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'

describe('GetEvenementEmploiQueryHandler', () => {
  let getEvenementEmploiQueryHandler: GetEvenementEmploiQueryHandler
  let sandbox: SinonSandbox
  let poleEmploiClient: StubbedClass<PoleEmploiClient>

  before(() => {
    sandbox = createSandbox()
    poleEmploiClient = stubClass(PoleEmploiClient)

    getEvenementEmploiQueryHandler = new GetEvenementEmploiQueryHandler(
      poleEmploiClient
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it("retourne l'évènement", async () => {
      // Given
      const query: GetEvenementEmploiQuery = {
        idEvenement: '75009'
      }

      poleEmploiClient.getEvenementEmploi.withArgs(query.idEvenement).resolves(
        success({
          id: 11111,
          ville: 'Paris',
          codePostal: '75012',
          codeInsee: '01419',
          longitude: 2.16,
          latitude: 36.547,
          description: 'description',
          heureDebut: '07:00:00',
          heureFin: '09:00:00',
          timezone: 'Europe/Paris',
          objectifs: ['International'],
          publics: ['Ouvert'],
          type: 'Atelier',
          modalites: ['en physique'],
          nombrePlaceTotalDistance: 0,
          nombrePlaceTotalPresentiel: 20,
          nombreInscritDistance: 0,
          nombreInscritPresentiel: 1,
          dateEvenement: '2023-05-17T07:00:00.000+00:00',
          titre: 'Atelier',
          codesRome: ['J', 'M', 'N'],
          multisectoriel: true,
          urlDetailEvenement: 'test'
        })
      )

      // When
      const result = await getEvenementEmploiQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        success({
          id: '11111',
          ville: 'Paris',
          codePostal: '75012',
          longitude: 2.16,
          latitude: 36.547,
          description: 'description',
          titre: 'Atelier',
          typeEvenement: 'Atelier',
          dateEvenement: '2023-05-17T07:00:00.000+00:00',
          heureDebut: '07:00:00',
          heureFin: '09:00:00',
          modalites: ['en physique'],
          nombrePlacesTotalDistancel: 0,
          nombrePlacesTotalPresentiel: 20,
          nombreInscritsDistancel: 0,
          nombreInscritsPresentiel: 1,
          url: 'test',
          deroulement: undefined
        })
      )
    })
  })
})
