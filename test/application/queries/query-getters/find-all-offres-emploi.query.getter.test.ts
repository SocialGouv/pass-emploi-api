import { expect, StubbedClass, stubClass } from '../../../utils'
import { uneOffreEmploiDto } from '../../../fixtures/offre-emploi.fixture'
import { isSuccess } from '../../../../src/building-blocks/types/result'
import { PoleEmploiClient } from '../../../../src/infrastructure/clients/pole-emploi-client'
import { DateTime } from 'luxon'
import { DateService } from '../../../../src/utils/date-service'
import { FindAllOffresEmploiQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-emploi.query.getter'
import { Offre } from '../../../../src/domain/offre/offre'
import { GetOffresEmploiQuery } from '../../../../src/application/queries/get-offres-emploi.query.handler'

describe('FindAllOffresEmploiQueryGetter', () => {
  let findAllOffresEmploiQueryGetter: FindAllOffresEmploiQueryGetter
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.001Z').toUTC()

  beforeEach(() => {
    const dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    poleEmploiClient = stubClass(PoleEmploiClient)

    findAllOffresEmploiQueryGetter = new FindAllOffresEmploiQueryGetter(
      poleEmploiClient,
      dateService
    )
  })

  describe('handle', () => {
    const criteres: GetOffresEmploiQuery = {
      page: 1,
      limit: 50,
      alternance: true,
      duree: [Offre.Emploi.Duree.tempsPlein],
      contrat: [Offre.Emploi.Contrat.cdd, Offre.Emploi.Contrat.autre],
      commune: 'Paris',
      q: 'mots clés',
      departement: '75',
      experience: [
        Offre.Emploi.Experience.entreUnEtTroisAns,
        Offre.Emploi.Experience.plusDeTroisAns
      ],
      debutantAccepte: true,
      rayon: 15
    }

    beforeEach(() => {
      // Given
      poleEmploiClient.get.resolves({
        config: undefined,
        headers: undefined,
        request: undefined,
        status: 0,
        statusText: '',
        data: []
      })
    })

    describe('fait appel à l"API de Pôle Emploi avec les bons paramètres', () => {
      it('quand tous les query params sont fournis', async () => {
        // When
        await findAllOffresEmploiQueryGetter.handle(criteres)
        const expectedQueryParams = new URLSearchParams({
          sort: '1',
          range: '0-49',
          motsCles: 'mots clés',
          departement: '75',
          natureContrat: 'E2,FS',
          experience: '2,3',
          experienceExigence: 'D',
          dureeHebdo: '1',
          typeContrat: 'CDI,DIN,CCE,FRA,LIB,REP,TTI',
          distance: '15',
          commune: 'Paris'
        })

        // Then
        expect(poleEmploiClient.getOffresEmploi).to.have.been.calledWith(
          expectedQueryParams
        )
      })
      it('quand que quelques query params sont fournis', async () => {
        // Given
        const criteres: GetOffresEmploiQuery = {
          page: 1,
          limit: 50,
          alternance: false,
          duree: [
            Offre.Emploi.Duree.tempsPlein,
            Offre.Emploi.Duree.tempsPartiel
          ],
          contrat: [Offre.Emploi.Contrat.cdd],
          commune: '75118'
        }

        // When
        await findAllOffresEmploiQueryGetter.handle(criteres)
        const expectedQueryParams = new URLSearchParams({
          sort: '1',
          range: '0-49',
          dureeHebdo: '1,2',
          typeContrat: 'CDD,MIS,SAI,DDI',
          commune: '75118'
        })

        // Then
        expect(poleEmploiClient.getOffresEmploi).to.have.been.calledWith(
          expectedQueryParams
        )
      })
      it('quand il y a une date de création minimum', async () => {
        // When
        const minDateDeCreation = maintenant.minus({ day: 1, hour: 2 })
        const criteres: GetOffresEmploiQuery = {
          page: 1,
          limit: 50,
          alternance: false,
          commune: '75118',
          minDateCreation: minDateDeCreation
        }
        await findAllOffresEmploiQueryGetter.handle(criteres)
        const expectedQueryParams = new URLSearchParams({
          sort: '1',
          range: '0-49',
          commune: '75118',
          minCreationDate: '2020-04-01T10:00:00Z',
          maxCreationDate: '2020-04-06T12:00:00Z'
        })

        // Then
        expect(poleEmploiClient.getOffresEmploi).to.have.been.calledWithExactly(
          expectedQueryParams
        )
      })
    })
    describe('quand il y a une 429', () => {
      it("rappelle l'api après le temps qu'il faut", async () => {
        // Given
        poleEmploiClient.getOffresEmploi
          .onFirstCall()
          .rejects({
            response: {
              status: 429,
              headers: {
                'retry-after': 1
              }
            }
          })
          .onSecondCall()
          .resolves({ resultats: [uneOffreEmploiDto()] })

        // When
        const result = await findAllOffresEmploiQueryGetter.handle(criteres)

        // Then
        expect(isSuccess(result)).to.be.equal(true)
        expect(poleEmploiClient.getOffresEmploi).to.have.callCount(2)
      })
      it('rejette après 2 appels en 429', async () => {
        // Given
        poleEmploiClient.getOffresEmploi.rejects({
          response: {
            status: 429,
            headers: {
              'retry-after': 1
            }
          }
        })

        // When
        const result = await findAllOffresEmploiQueryGetter.handle(criteres)

        // Then
        expect(isSuccess(result)).to.be.equal(false)
        expect(poleEmploiClient.getOffresEmploi).to.have.callCount(2)
      })
    })
  })
})
