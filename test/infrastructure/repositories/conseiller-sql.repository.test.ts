import { Conseiller } from '../../../src/domain/conseiller'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
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

  describe('getQueryModelById', () => {
    it('retourne les conseiller quand le conseiller existe', async () => {
      const idConseiller: Conseiller.Id = '1'
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: idConseiller, prenom: 'toto', nom: 'tata' })
      )

      const actual = await conseillerSqlRepository.getQueryModelById(
        idConseiller
      )

      expect(actual).to.deep.equal(
        detailConseillerQueryModel({
          id: idConseiller,
          firstName: 'toto',
          lastName: 'tata'
        })
      )
    })

    it("retourne undefined quand le conseiller n'existe pas", async () => {
      const actual = await conseillerSqlRepository.getQueryModelById(
        'id-inexistant'
      )

      expect(actual).to.equal(undefined)
    })
  })
})
