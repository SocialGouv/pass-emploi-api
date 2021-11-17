import { Conseiller } from '../../../src/domain/conseiller'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unConseillerEtSesJeunesQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../utils'
import { DatabaseForTesting } from '../../utils'

describe('ConseillerSqlRepository', () => {
  DatabaseForTesting.prepare()
  let conseillerSqlRepository: ConseillerSqlRepository

  beforeEach(async () => {
    conseillerSqlRepository = new ConseillerSqlRepository()
  })

  describe('get', () => {
    it('retourne le conseiller', async () => {
      // Given
      await conseillerSqlRepository.save(unConseiller())

      // When
      const conseiller = await conseillerSqlRepository.get(unConseiller().id)

      // Then
      expect(conseiller).to.deep.equal(unConseiller())
    })
  })

  describe('getAvecJeunes', () => {
    describe('Quand le conseiller existe', () => {
      it('retourne les conseiller et ses jeunes', async () => {
        // Given
        const idConseiller: Conseiller.Id = '1'
        await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
        await JeuneSqlModel.creer(unJeuneDto({ idConseiller }))

        // When
        const actual = await conseillerSqlRepository.getAvecJeunes(idConseiller)

        // Then
        expect(actual).to.deep.equal(unConseillerEtSesJeunesQueryModel())
      })
    })

    describe("Quand le conseiller n'existe pas", () => {
      it('retourne undefined', async () => {
        // When
        const actual = await conseillerSqlRepository.getAvecJeunes(
          'id-inexistant'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })
})
