import { Emploi } from '../../../../src/domain/offre/favori/offre-emploi'
import { OffresEmploiHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { uneOffreEmploi } from '../../../fixtures/offre-emploi.fixture'
import { getDatabase } from '../../../utils/database-for-testing'
import { DateService } from '../../../../src/utils/date-service'

describe('OffresEmploiHttpSqlRepository', () => {
  let offresEmploiHttpSqlRepository: OffresEmploiHttpSqlRepository
  let dateService: StubbedClass<DateService>

  beforeEach(async () => {
    await getDatabase().cleanPG()

    dateService = stubClass(DateService)
    dateService.nowJs.returns(new Date('2023-04-17T12:00:00Z'))

    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository(
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
        await offresEmploiHttpSqlRepository.save('ABCDE', uneOffreEmploi())

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
    let offreEmploi: Emploi

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreEmploi = uneOffreEmploi({
        origine: undefined
      })
      await offresEmploiHttpSqlRepository.save('ABCDE', offreEmploi)
    })

    describe("quand le favori n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const favori = await offresEmploiHttpSqlRepository.get(
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
        const favori = await offresEmploiHttpSqlRepository.get(
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
        const offreEmploiSansLocalisation: Emploi = {
          ...uneOffreEmploi(),
          localisation: undefined,
          id: 'une-offre-sans-localisation'
        }
        await offresEmploiHttpSqlRepository.save(
          'ABCDE',
          offreEmploiSansLocalisation
        )

        // When
        const favori = await offresEmploiHttpSqlRepository.get(
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
    let offreEmploi: Emploi

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
      await offresEmploiHttpSqlRepository.save('ABCDE', offreEmploi)
      // When
      await offresEmploiHttpSqlRepository.delete('ABCDE', offreEmploi.id)
      // Then
      const actual = await offresEmploiHttpSqlRepository.get(
        'ABCDE',
        offreEmploi.id
      )
      expect(actual).to.equal(undefined)
    })
  })
})
