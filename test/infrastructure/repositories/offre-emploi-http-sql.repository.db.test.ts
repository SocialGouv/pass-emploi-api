import { OffreEmploi } from '../../../src/domain/offre-emploi'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../utils'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('OffresEmploiHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let offresEmploiHttpSqlRepository: OffresEmploiHttpSqlRepository

  beforeEach(async () => {
    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository()
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
})
