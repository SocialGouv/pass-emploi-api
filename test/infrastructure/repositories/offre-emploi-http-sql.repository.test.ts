import { OffreEmploi } from '../../../src/domain/offre-emploi'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect, stubClass } from '../../utils'
import {
  uneOffreEmploi,
  uneOffreEmploiResumeQueryModel
} from '../../fixtures/offre-emploi.fixture'

describe('OffresEmploiHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let offresEmploiHttpSqlRepository: OffresEmploiHttpSqlRepository
  const poleEmploiClient = stubClass(PoleEmploiClient)

  beforeEach(async () => {
    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository(
      poleEmploiClient
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
    describe('fait appel à l"API de Pôle Emploi avec les bons paramètres', () => {
      it('quand tous les query params sont fournis', async () => {
        // Given
        poleEmploiClient.get.resolves({
          config: undefined,
          headers: undefined,
          request: undefined,
          status: 0,
          statusText: '',
          data: []
        })
        // When
        await offresEmploiHttpSqlRepository.findAll(
          1,
          50,
          true,
          'mots clés',
          '75',
          ['2', '3'],
          ['1'],
          ['CDI', 'autre']
        )
        const expectedQueryParams = new URLSearchParams({
          sort: '1',
          range: '0-49',
          motsCles: 'mots clés',
          departement: '75',
          natureContrat: 'E2',
          experience: '2,3',
          dureeHebdo: '1',
          typeContrat: 'CDI,DIN,CCE,FRA,LIB,REP,TTI'
        })

        // Then
        expect(poleEmploiClient.get).to.have.been.calledWith(
          'offresdemploi/v2/offres/search',
          expectedQueryParams
        )
      })
      it('quand que quelques query params sont fournis', async () => {
        // Given
        poleEmploiClient.get.resolves({
          config: undefined,
          headers: undefined,
          request: undefined,
          status: 0,
          statusText: '',
          data: []
        })
        // When
        await offresEmploiHttpSqlRepository.findAll(
          1,
          50,
          false,
          undefined,
          undefined,
          undefined,
          ['1,3'],
          ['CDD']
        )
        const expectedQueryParams = new URLSearchParams({
          sort: '1',
          range: '0-49',
          dureeHebdo: '1,3',
          typeContrat: 'CDD'
        })

        // Then
        expect(poleEmploiClient.get).to.have.been.calledWith(
          'offresdemploi/v2/offres/search',
          expectedQueryParams
        )
      })
    })
  })
})
