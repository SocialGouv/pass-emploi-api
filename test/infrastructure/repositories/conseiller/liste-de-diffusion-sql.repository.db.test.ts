import { Conseiller } from '../../../../src/domain/conseiller/conseiller'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { DatabaseForTesting } from '../../../utils/database-for-testing'
import { ListeDeDiffusionSqlRepository } from '../../../../src/infrastructure/repositories/conseiller/liste-de-diffusion-sql.repository.db'
import { unConseillerDuJeune, unJeune } from '../../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { uneListeDeDiffusion } from '../../../fixtures/liste-de-diffusion.fixture'
import { expect } from '../../../utils'
import { ListeDeDiffusion } from '../../../../src/domain/conseiller/liste-de-diffusion'
import { uneAutreDatetime, uneDatetime } from '../../../fixtures/date.fixture'

describe(' ListeDeDiffusionSqlRepository', () => {
  const database = DatabaseForTesting.prepare()

  let repository: Conseiller.ListeDeDiffusion.Repository
  const jeune: Jeune = unJeune({
    conseiller: unConseillerDuJeune({ idAgence: undefined })
  })
  const conseillerDto = unConseillerDto({ id: jeune.conseiller!.id })

  beforeEach(async () => {
    repository = new ListeDeDiffusionSqlRepository(database.sequelize)

    await ConseillerSqlModel.creer(conseillerDto)
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: jeune.id,
        idConseiller: conseillerDto.id
      })
    )
  })

  describe('save', () => {
    it('crée une nouvelle liste de diffusion', async () => {
      // Given
      const nouvelleListeDeDiffusion = uneListeDeDiffusion()

      // When
      await repository.save(nouvelleListeDeDiffusion)

      // Then
      const actual = await repository.get(nouvelleListeDeDiffusion.id)
      expect(actual).to.deep.equal(nouvelleListeDeDiffusion)
    })
    it('met à jour une liste de diffusion', async () => {
      // Given
      const unJeuneQuiResteDansLaListe = unJeune()
      const unJeuneQuiQuitteLaListe = unJeune({
        id: 'e6c073c4-125f-41ad-aa0b-42eaf91e0659'
      })
      const unNouveauJeuneDansLaListe = unJeune({
        id: '38bcd5e0-574d-44c0-a7d8-7703f52ae2f4'
      })
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: unJeuneQuiQuitteLaListe.id,
          idConseiller: conseillerDto.id
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: unNouveauJeuneDansLaListe.id,
          idConseiller: conseillerDto.id
        })
      )
      const nouvelleListeDeDiffusion = uneListeDeDiffusion({
        beneficiaires: [
          {
            id: unJeuneQuiResteDansLaListe.id,
            dateAjout: uneDatetime()
          },
          {
            id: unJeuneQuiQuitteLaListe.id,
            dateAjout: uneDatetime()
          }
        ]
      })
      await repository.save(nouvelleListeDeDiffusion)
      const listeDeDiffusionAJour: ListeDeDiffusion = {
        ...nouvelleListeDeDiffusion,
        titre: 'un nouveau titre',
        beneficiaires: [
          {
            id: unJeuneQuiResteDansLaListe.id,
            dateAjout: uneDatetime()
          },
          {
            id: unNouveauJeuneDansLaListe.id,
            dateAjout: uneAutreDatetime()
          }
        ]
      }

      // When
      await repository.save(listeDeDiffusionAJour)

      // Then
      const actual = await repository.get(nouvelleListeDeDiffusion.id)
      expect(actual).to.deep.equal(listeDeDiffusionAJour)
      const associations =
        await ListeDeDiffusionJeuneAssociationSqlModel.findAll()
      expect(associations).to.have.length(2)
    })
  })

  describe('delete', () => {
    it('supprime une liste de diffusion', async () => {
      // Given
      const listeDeDiffusion = uneListeDeDiffusion()
      await repository.save(listeDeDiffusion)

      // When
      await repository.delete(listeDeDiffusion.id)

      // Then
      const actual = await repository.get(listeDeDiffusion.id)
      expect(actual).to.equal(undefined)
      const associations =
        await ListeDeDiffusionJeuneAssociationSqlModel.findAll()
      expect(associations).to.deep.equal([])
    })
  })
})
