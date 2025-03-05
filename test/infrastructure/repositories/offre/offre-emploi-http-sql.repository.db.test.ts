import { DateTime } from 'luxon'
import { Emploi } from '../../../../src/domain/offre/favori/offre-emploi'
import { OffresEmploiHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { uneOffreEmploi } from '../../../fixtures/offre-emploi.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('OffresEmploiHttpSqlRepository', () => {
  let offresEmploiHttpSqlRepository: OffresEmploiHttpSqlRepository
  const now = DateTime.now()

  beforeEach(async () => {
    await getDatabase().cleanPG()

    offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository()
  })

  describe('.save', () => {
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
      await offresEmploiHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        dateCreation: now,
        offre: uneOffreEmploi()
      })

      // Then
      const offresEmplois = await FavoriOffreEmploiSqlModel.findAll()
      expect(offresEmplois).to.have.length(1)
      expect(offresEmplois[0].dataValues).to.deep.include({
        codePostalLocalisation: '77185',
        communeLocalisation: '77258',
        dateCandidature: null,
        dateCreation: now.toJSDate(),
        duree: 'Temps plein',
        idJeune: 'ABCDE',
        idOffre: '123DXPM',
        isAlternance: false,
        nomEntreprise: 'RH TT INTERIM',
        nomLocalisation: '77 - LOGNES',
        origineLogoUrl: null,
        origineNom: null,
        titre: 'Technicien / Technicienne en froid et climatisation',
        typeContrat: 'MIS'
      })
    })

    it('modifie un favori', async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      await offresEmploiHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        dateCreation: now.minus({ day: 1 }),
        offre: uneOffreEmploi()
      })

      // When
      await offresEmploiHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        dateCreation: now.minus({ day: 1 }),
        dateCandidature: now,
        offre: uneOffreEmploi()
      })

      // Then
      const offresEmplois = await FavoriOffreEmploiSqlModel.findAll()
      expect(offresEmplois[0].dataValues).to.deep.include({
        idJeune: 'ABCDE',
        idOffre: '123DXPM',
        dateCreation: now.minus({ day: 1 }).toJSDate(),
        dateCandidature: now.toJSDate()
      })
    })
  })

  describe('.get', () => {
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
      await offresEmploiHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        dateCreation: now,
        offre: offreEmploi
      })
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
        expect(favori).to.deep.equal({
          idBeneficiaire: 'ABCDE',
          dateCreation: now,
          offre: offreEmploi
        })
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
        await offresEmploiHttpSqlRepository.save({
          idBeneficiaire: 'ABCDE',
          dateCreation: now,
          offre: offreEmploiSansLocalisation
        })

        // When
        const favori = await offresEmploiHttpSqlRepository.get(
          'ABCDE',
          offreEmploiSansLocalisation.id
        )
        // Then
        expect(favori?.offre.localisation).to.deep.equal({
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
      await offresEmploiHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        dateCreation: now,
        offre: offreEmploi
      })
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
