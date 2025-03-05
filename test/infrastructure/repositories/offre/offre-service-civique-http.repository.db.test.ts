import { DateTime } from 'luxon'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEngagementSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { Offre } from '../../../../src/domain/offre/offre'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { uneOffreServiceCivique } from '../../../fixtures/offre-service-civique.fixture'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('OffreServiceCiviqueHttpSqlRepository', () => {
  let offreServiceCiviqueHttpSqlRepository: OffreServiceCiviqueHttpSqlRepository
  const now = DateTime.now()

  beforeEach(async () => {
    await getDatabase().cleanPG()

    offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository()
  })

  describe('get', () => {
    describe('quand il existe', () => {
      it('renvoie le favori', async () => {
        // Given
        const jeuneDto: AsSql<JeuneDto> = {
          ...unJeuneDto(),
          idConseiller: undefined
        }
        await JeuneSqlModel.creer(jeuneDto)
        const offre: Offre.Favori.ServiceCivique = {
          id: 'unId',
          domaine: Offre.ServiceCivique.Domaine.education,
          ville: 'Paris',
          titre: 'La best offre',
          organisation: 'FNAC',
          dateDeDebut: '2022-05-12T10:00:10'
        }
        await offreServiceCiviqueHttpSqlRepository.save({
          idBeneficiaire: jeuneDto.id,
          offre,
          dateCreation: now
        })

        // When
        const favori = await offreServiceCiviqueHttpSqlRepository.get(
          jeuneDto.id,
          offre.id
        )

        // Then
        expect(favori).to.deep.equal({
          idBeneficiaire: jeuneDto.id,
          dateCreation: now,
          offre
        })
      })
    })

    describe('quand il existe pas', () => {
      it('renvoie undefined', async () => {
        // Given
        const jeuneDto: AsSql<JeuneDto> = {
          ...unJeuneDto(),
          idConseiller: undefined
        }
        await JeuneSqlModel.creer(jeuneDto)
        const offre = uneOffreServiceCivique()

        // When
        const favori = await offreServiceCiviqueHttpSqlRepository.get(
          jeuneDto.id,
          offre.id
        )

        // Then
        expect(favori).to.equal(undefined)
      })
    })
  })

  describe('delete', () => {
    it('supprime un favori', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre = uneOffreServiceCivique()
      await offreServiceCiviqueHttpSqlRepository.save({
        idBeneficiaire: jeuneDto.id,
        offre,
        dateCreation: now
      })

      // When
      await offreServiceCiviqueHttpSqlRepository.delete(jeuneDto.id, offre.id)

      // Then
      const favori = await offreServiceCiviqueHttpSqlRepository.get(
        jeuneDto.id,
        offre.id
      )
      expect(favori).to.equal(undefined)
    })
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
      await offreServiceCiviqueHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: uneOffreServiceCivique(),
        dateCreation: now
      })

      // Then
      const offresServiceCivique = await FavoriOffreEngagementSqlModel.findAll()
      expect(offresServiceCivique.length).to.equal(1)
      expect(offresServiceCivique[0].dataValues).to.deep.include({
        dateCandidature: null,
        dateCreation: now.toJSDate(),
        dateDeDebut: '2022-02-17T10:00:00.000Z',
        domaine: 'Informatique',
        idJeune: 'ABCDE',
        idOffre: 'unId',
        organisation: 'orga de ouf',
        titre: 'unTitre',
        ville: 'paris'
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
      await offreServiceCiviqueHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: uneOffreServiceCivique(),
        dateCreation: now.minus({ day: 1 })
      })

      // When
      await offreServiceCiviqueHttpSqlRepository.save({
        idBeneficiaire: 'ABCDE',
        offre: uneOffreServiceCivique(),
        dateCreation: now.minus({ day: 1 }),
        dateCandidature: now
      })

      // Then
      const offresServiceCivique = await FavoriOffreEngagementSqlModel.findAll()
      expect(offresServiceCivique.length).to.equal(1)
      expect(offresServiceCivique[0].dataValues).to.deep.include({
        dateCreation: now.minus({ day: 1 }).toJSDate(),
        dateCandidature: now.toJSDate(),
        idJeune: 'ABCDE',
        idOffre: 'unId'
      })
    })
  })
})
