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

describe(' ListeDeDiffusionSqlRepository', () => {
  const database = DatabaseForTesting.prepare()

  let repository: ListeDeDiffusionSqlRepository
  const jeune: Jeune = unJeune({
    conseiller: unConseillerDuJeune({ idAgence: undefined })
  })

  beforeEach(async () => {
    repository = new ListeDeDiffusionSqlRepository(database.sequelize)

    const conseillerDto = unConseillerDto({ id: jeune.conseiller!.id })
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
  })
})
