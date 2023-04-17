import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { uneOffreServiceCivique } from '../../../fixtures/offre-service-civique.fixture'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { Offre } from '../../../../src/domain/offre/offre'
import { getDatabase } from '../../../utils/database-for-testing'
import { DateService } from '../../../../src/utils/date-service'

describe('OffreServiceCiviqueHttpSqlRepository', () => {
  let offreServiceCiviqueHttpSqlRepository: OffreServiceCiviqueHttpSqlRepository
  let dateService: StubbedClass<DateService>

  beforeEach(async () => {
    await getDatabase().cleanPG()

    dateService = stubClass(DateService)
    dateService.nowJs.returns(new Date('2023-04-17T12:00:00Z'))

    offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository(dateService)
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
