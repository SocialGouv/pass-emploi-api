import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { DatabaseForTesting, expect } from '../../utils'
import { uneDatetime } from 'test/fixtures/date.fixture'

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

  describe('getAllIds', () => {
    it('retourne les ids conseiller', async () => {
      // Given
      await conseillerSqlRepository.save(unConseiller())

      // When
      const ids = await conseillerSqlRepository.getAllIds()

      // Then
      expect(ids).to.deep.equal([unConseiller().id])
    })
  })

  describe('findConseillersMessagesNonVerifies', () => {
    it("recupere les conseillers avec des messages non verifies aujourd'hui", async () => {
      // Given
      const dateMaintenant = uneDatetime
      const dateHier = uneDatetime.minus({ day: 1 })
      const dateRechercheAujourdhui = uneDatetime.minus({ minute: 1 })

      const conseillerAvecMessagesNonVerifies = unConseiller({
        id: '1',
        dateVerificationMessages: dateHier
      })
      const conseillerAvecMessagesVerifiesAujourdhui = unConseiller({
        id: '2',
        dateVerificationMessages: dateRechercheAujourdhui
      })
      const conseillerAvecMessagesDejaVerifies = unConseiller({
        id: '3',
        dateVerificationMessages: dateMaintenant
      })

      await conseillerSqlRepository.save(conseillerAvecMessagesNonVerifies)
      await conseillerSqlRepository.save(
        conseillerAvecMessagesVerifiesAujourdhui
      )
      await conseillerSqlRepository.save(conseillerAvecMessagesDejaVerifies)

      // When
      const conseillers =
        await conseillerSqlRepository.findConseillersMessagesNonVerifies(
          100,
          dateMaintenant
        )

      // Then
      expect(conseillers.length).to.equal(1)
      expect(conseillers[0].id).to.deep.equal(
        conseillerAvecMessagesNonVerifies.id
      )
    })
  })
})
