import {
  Contrat,
  Duree,
  Experience,
  OffreEmploi,
  OffresEmploi
} from '../../../src/domain/offre-emploi'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import {
  uneOffreEmploi,
  uneOffreEmploiDto,
  uneOffreEmploiResumeQueryModel
} from '../../fixtures/offre-emploi.fixture'
import { DateService } from '../../../src/utils/date-service'
import { DateTime } from 'luxon'
import { isSuccess } from '../../../src/building-blocks/types/result'

describe('OffresEmploiHttpSqlRepository', () => {
  let offresEmploiHttpSqlRepository: OffresEmploiHttpSqlRepository
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.001Z').toUTC()

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    poleEmploiClient = stubClass(PoleEmploiClient)

    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository(
      poleEmploiClient,
      dateService
    )
  })

  describe('.saveAsFavori', () => {
    describe("quand le favori n'existe pas", () => {
      it('sauvegarde un favori', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'ABCDE',
            idConseiller: 'ZIDANE'
          })
        )
        // When
        await offresEmploiHttpSqlRepository.saveAsFavori(
          'ABCDE',
          uneOffreEmploi()
        )

        // Then
        const offresEmplois = await FavoriOffreEmploiSqlModel.findAll()
        expect(offresEmplois.length).to.equal(1)
        expect(offresEmplois[0].idOffre).to.equal('123DXPM')
        expect(offresEmplois[0].idJeune).to.equal('ABCDE')
        expect(offresEmplois[0].titre).to.equal(
          'Technicien / Technicienne en froid et climatisation'
        )
        expect(offresEmplois[0].typeContrat).to.equal('MIS')
        expect(offresEmplois[0].nomEntreprise).to.equal('RH TT INTERIM')
        expect(offresEmplois[0].duree).to.equal('Temps plein')
        expect(offresEmplois[0].nomLocalisation).to.equal('77 - LOGNES')
        expect(offresEmplois[0].codePostalLocalisation).to.equal('77185')
        expect(offresEmplois[0].communeLocalisation).to.equal('77258')
        expect(offresEmplois[0].isAlternance).to.equal(false)
      })
    })
  })

  describe('.getFavori', () => {
    let offreEmploi: OffreEmploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreEmploi = uneOffreEmploi()
      await offresEmploiHttpSqlRepository.saveAsFavori('ABCDE', offreEmploi)
    })

    describe("quand le favori n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const favori = await offresEmploiHttpSqlRepository.getFavori(
          'ABCDE',
          'UN MAUVAIS ID'
        )
        // Then
        expect(favori).to.equal(undefined)
      })
    })

    describe('quand le favori existe', () => {
      it("renvoie l'offre d'emploi", async () => {
        // When
        const favori = await offresEmploiHttpSqlRepository.getFavori(
          'ABCDE',
          offreEmploi.id
        )
        // Then
        expect(favori).to.deep.equal(offreEmploi)
      })
    })

    describe('quand le favori existe et que la localisation est vide', () => {
      it("renvoie l'offre d'emploi avec des string vide dans la localisation pour ne pas casser le mobile", async () => {
        // Given
        const offreEmploiSansLocalisation: OffreEmploi = {
          ...uneOffreEmploi(),
          localisation: undefined,
          id: 'une-offre-sans-localisation'
        }
        await offresEmploiHttpSqlRepository.saveAsFavori(
          'ABCDE',
          offreEmploiSansLocalisation
        )

        // When
        const favori = await offresEmploiHttpSqlRepository.getFavori(
          'ABCDE',
          offreEmploiSansLocalisation.id
        )
        // Then
        expect(favori?.localisation).to.deep.equal({
          nom: '',
          codePostal: '',
          commune: ''
        })
      })
    })
  })

  describe('.getFavorisIdsQueryModelsByJeune', () => {
    let offreEmploi: OffreEmploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreEmploi = uneOffreEmploi()
      await offresEmploiHttpSqlRepository.saveAsFavori('ABCDE', offreEmploi)
    })

    describe('quand le jeune a des favoris', () => {
      it('renvoie liste des ids', async () => {
        // When
        const favorisIds =
          await offresEmploiHttpSqlRepository.getFavorisIdsQueryModelsByJeune(
            'ABCDE'
          )

        // Then
        expect(favorisIds).to.deep.equal([{ id: '123DXPM' }])
      })
    })
  })

  describe('.getFavorisQueryModelsByJeune', () => {
    let offreEmploi: OffreEmploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreEmploi = uneOffreEmploi()
      await offresEmploiHttpSqlRepository.saveAsFavori('ABCDE', offreEmploi)
    })

    describe('quand le jeune a des favoris', () => {
      it('renvoie liste des favoris', async () => {
        const offreEmploiResumeQueryModel = uneOffreEmploiResumeQueryModel()

        // When
        const favoris =
          await offresEmploiHttpSqlRepository.getFavorisQueryModelsByJeune(
            'ABCDE'
          )

        // Then
        expect(favoris).to.deep.equal([offreEmploiResumeQueryModel])
      })
    })
  })

  describe('.deleteFavori', () => {
    let offreEmploi: OffreEmploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
    })

    it('supprime le favori', async () => {
      // Given
      offreEmploi = uneOffreEmploi()
      await offresEmploiHttpSqlRepository.saveAsFavori('ABCDE', offreEmploi)
      // When
      await offresEmploiHttpSqlRepository.deleteFavori('ABCDE', offreEmploi.id)
      // Then
      const actual = await offresEmploiHttpSqlRepository.getFavori(
        'ABCDE',
        offreEmploi.id
      )
      expect(actual).to.equal(undefined)
    })
  })

  describe('.findAll', () => {
    const criteres: OffresEmploi.Criteres = {
      page: 1,
      limit: 50,
      alternance: true,
      duree: [Duree.tempsPlein],
      contrat: [Contrat.cdd, Contrat.autre],
      commune: 'Paris',
      q: 'mots clés',
      departement: '75',
      experience: [Experience.entreUnEtTroisAns, Experience.plusDeTroisAns],
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
        await offresEmploiHttpSqlRepository.findAll(criteres)
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
        const criteres: OffresEmploi.Criteres = {
          page: 1,
          limit: 50,
          alternance: false,
          duree: [Duree.tempsPlein, Duree.tempsPartiel],
          contrat: [Contrat.cdd],
          commune: '75118'
        }

        // When
        await offresEmploiHttpSqlRepository.findAll(criteres)
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
        const minDateCreation = maintenant.minus({ day: 1, hour: 2 })
        const criteres: OffresEmploi.Criteres = {
          page: 1,
          limit: 50,
          alternance: false,
          commune: '75118',
          minDateCreation
        }
        await offresEmploiHttpSqlRepository.findAll(criteres)
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
        const result = await offresEmploiHttpSqlRepository.findAll(criteres)

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
        const result = await offresEmploiHttpSqlRepository.findAll(criteres)

        // Then
        expect(isSuccess(result)).to.be.equal(false)
        expect(poleEmploiClient.getOffresEmploi).to.have.callCount(2)
      })
    })
  })
})
