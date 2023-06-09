import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import {
  GetEvenementsEmploiQuery,
  GetEvenementsEmploiQueryHandler
} from 'src/application/queries/get-evenements-emploi.query.handler'
import { success } from 'src/building-blocks/types/result'
import { EvenementEmploiCodePostalQueryGetter } from 'src/application/queries/query-getters/evenement-emploi-code-postal.query.getter'

describe('GetEvenementsEmploiQueryHandler', () => {
  let getEvenementsEmploiQueryHandler: GetEvenementsEmploiQueryHandler
  let sandbox: SinonSandbox
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  let codePostalQueryGetter: StubbedClass<EvenementEmploiCodePostalQueryGetter>

  before(() => {
    sandbox = createSandbox()
    poleEmploiClient = stubClass(PoleEmploiClient)
    codePostalQueryGetter = stubClass(EvenementEmploiCodePostalQueryGetter)

    getEvenementsEmploiQueryHandler = new GetEvenementsEmploiQueryHandler(
      poleEmploiClient,
      codePostalQueryGetter
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('sans critères', () => {
      it('retourne toutes les offres', async () => {
        // Given
        const query: GetEvenementsEmploiQuery = {
          codePostal: '75001'
        }

        codePostalQueryGetter.getCodePostauxAssocies
          .withArgs('75001')
          .returns(['75001', '75012'])

        poleEmploiClient.getEvenementsEmploi
          .withArgs({
            ...query,
            codePostaux: ['75001', '75012'],
            page: 1,
            limit: 10,
            dateDebut: undefined,
            dateFin: undefined
          })
          .resolves(
            success({
              totalElements: 1,
              content: [
                {
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
                }
              ]
            })
          )

        // When
        const result = await getEvenementsEmploiQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success({
            pagination: { page: 1, limit: 10, total: 1 },
            results: [
              {
                id: '11111',
                ville: 'Paris',
                codePostal: '75012',
                titre: 'Atelier',
                typeEvenement: 'Atelier',
                dateEvenement: '2023-05-17T07:00:00.000+00:00',
                heureDebut: '07:00:00',
                heureFin: '09:00:00',
                modalites: ['en physique']
              }
            ]
          })
        )
      })
    })
  })
})
