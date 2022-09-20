import {
  JeuneDto,
  JeuneSqlModel
} from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../utils'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-service-civique-http.repository.db'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { Offre } from '../../../src/domain/offre/offre'

describe('OffreServiceCiviqueHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let offreServiceCiviqueHttpSqlRepository: OffreServiceCiviqueHttpSqlRepository

  beforeEach(async () => {
    offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository()
  })

  describe('getFavori', () => {
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
        await offreServiceCiviqueHttpSqlRepository.save(jeuneDto.id, offre)

        // When
        const favori = await offreServiceCiviqueHttpSqlRepository.get(
          jeuneDto.id,
          offre.id
        )

        // Then
        expect(favori).to.deep.equal(offre)
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

  describe('deleteFavori', () => {
    it('supprime un favori', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre = uneOffreServiceCivique()
      await offreServiceCiviqueHttpSqlRepository.save(jeuneDto.id, offre)

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
})
