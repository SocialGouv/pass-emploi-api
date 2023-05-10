import { DateTime } from 'luxon'
import { GetOffresEmploiQuery } from '../../../../src/application/queries/get-offres-emploi.query.handler'
import { FindAllOffresEmploiQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-emploi.query.getter'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { Offre } from '../../../../src/domain/offre/offre'
import { PoleEmploiClient } from '../../../../src/infrastructure/clients/pole-emploi-client'
import { DateService } from '../../../../src/utils/date-service'
import { expect, StubbedClass, stubClass } from '../../../utils'

describe('FindAllOffresEmploiQueryGetter', () => {
  let findAllOffresEmploiQueryGetter: FindAllOffresEmploiQueryGetter
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.001Z')

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
      alternance: 'true',
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

    describe("fait appel à l'API de Pôle Emploi avec les bons paramètres", () => {
      it('quand tous les query params sont fournis', async () => {
        // Given
        poleEmploiClient.getOffresEmploi.resolves(
          success({ total: 10, resultats: [] })
        )

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
        poleEmploiClient.getOffresEmploi.resolves(
          success({ total: 10, resultats: [] })
        )
        const criteres: GetOffresEmploiQuery = {
          page: 1,
          limit: 50,
          alternance: 'false',
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
          natureContrat: 'CC,FT,EE,CU,CI,FU,ER,I1,FJ,PS,PR',
          typeContrat: 'CDD,MIS,SAI,DDI',
          commune: '75118'
        })

        // Then
        expect(poleEmploiClient.getOffresEmploi).to.have.been.calledWith(
          expectedQueryParams
        )
      })
      it('quand il y a une date de création minimum', async () => {
        // Given
        poleEmploiClient.getOffresEmploi.resolves(
          success({ total: 10, resultats: [] })
        )
        const minDateDeCreation = maintenant.minus({ day: 1, hour: 2 })
        const criteres: GetOffresEmploiQuery = {
          page: 1,
          limit: 50,
          alternance: 'false',
          commune: '75118',
          minDateCreation: minDateDeCreation.toISO()
        }

        // When
        await findAllOffresEmploiQueryGetter.handle(criteres)

        // Then
        const expectedQueryParams = new URLSearchParams({
          sort: '1',
          range: '0-49',
          natureContrat: 'CC,FT,EE,CU,CI,FU,ER,I1,FJ,PS,PR',
          commune: '75118',
          minCreationDate: '2020-04-05T10:00:00Z',
          maxCreationDate: '2020-04-06T12:00:00Z'
        })
        expect(
          poleEmploiClient.getOffresEmploi.getCall(0).firstArg.toString()
        ).to.be.equal(expectedQueryParams.toString())
      })
    })
    describe("quand la récupération d'offres est en succès", () => {
      it('renvoie un succes', async () => {
        // Given
        poleEmploiClient.getOffresEmploi.resolves(
          success({ total: 10, resultats: [] })
        )

        // When
        const result = await findAllOffresEmploiQueryGetter.handle(criteres)

        // Then
        expect(result._isSuccess).to.be.true()
      })
    })
    describe("quand la récupération d'offres est en erreur", () => {
      it('renvoie une failure', async () => {
        // Given
        poleEmploiClient.getOffresEmploi.resolves(
          failure(new ErreurHttp('erreur', 429))
        )

        // When
        const result = await findAllOffresEmploiQueryGetter.handle(criteres)

        // Then
        expect(result._isSuccess).to.be.false()
      })
    })
  })
})
