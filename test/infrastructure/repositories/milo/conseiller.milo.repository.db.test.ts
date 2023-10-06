import {
  ConseillerMiloSansStructure,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ConseillerMiloSqlRepository } from '../../../../src/infrastructure/repositories/milo/conseiller.milo.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { expect } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('ConseillerMiloSqlRepository', () => {
  let conseillerMiloSqlRepository: ConseillerMiloSqlRepository
  const idConseiller = '1'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    conseillerMiloSqlRepository = new ConseillerMiloSqlRepository()
  })

  describe('get', () => {
    it("retourne une failure quand le conseiller n'existe pas", async () => {
      // When
      const conseiller = await conseillerMiloSqlRepository.get(idConseiller)

      // Then
      expect(conseiller).to.deep.equal(
        failure(new NonTrouveError('Conseiller Milo', idConseiller))
      )
    })
    it('retourne une failure quand le conseiller existe mais sans structure Milo', async () => {
      // Given
      await ConseillerSqlModel.create(unConseillerDto({ id: idConseiller }))

      // When
      const conseiller = await conseillerMiloSqlRepository.get(idConseiller)

      // Then
      expect(conseiller).to.deep.equal(
        failure(new ConseillerMiloSansStructure(idConseiller))
      )
    })
    it('retourne le conseiller existant avec structure Milo', async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })
      await ConseillerSqlModel.create(
        unConseillerDto({ id: idConseiller, idStructureMilo })
      )

      // When
      const conseiller = await conseillerMiloSqlRepository.get(idConseiller)

      // Then
      expect(conseiller).to.deep.equal(
        success({
          id: idConseiller,
          structure: { id: idStructureMilo, timezone: 'Europe/Paris' }
        })
      )
    })
  })

  describe('save', () => {
    it('met à jour la structure et la dateMajStructure Milo du conseiller', async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })
      await ConseillerSqlModel.create(unConseillerDto({ id: idConseiller }))

      // When
      await conseillerMiloSqlRepository.save({
        id: idConseiller,
        idStructure: idStructureMilo,
        dateVerificationStructureMilo: uneDatetime()
      })

      // Then
      const conseillerTrouve = await ConseillerSqlModel.findByPk(idConseiller)
      expect(conseillerTrouve?.idStructureMilo).to.equal(idStructureMilo)
      expect(conseillerTrouve?.dateVerificationStructureMilo).to.deep.equal(
        uneDatetime().toJSDate()
      )
    })
    it("met à jour la dateMajStructure Milo du conseiller sans modifier l'idStructure", async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })
      await ConseillerSqlModel.create(
        unConseillerDto({ id: idConseiller, idStructureMilo })
      )

      // When
      await conseillerMiloSqlRepository.save({
        id: idConseiller,
        dateVerificationStructureMilo: uneDatetime()
      })

      // Then
      const conseillerTrouve = await ConseillerSqlModel.findByPk(idConseiller)
      expect(conseillerTrouve?.idStructureMilo).to.equal(idStructureMilo)
      expect(conseillerTrouve?.dateVerificationStructureMilo).to.deep.equal(
        uneDatetime().toJSDate()
      )
    })
    it('met un idStructureMilo à null pour le conseiller', async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })
      await ConseillerSqlModel.create(
        unConseillerDto({ id: idConseiller, idStructureMilo })
      )

      // When
      await conseillerMiloSqlRepository.save({
        id: idConseiller,
        idStructure: null,
        dateVerificationStructureMilo: uneDatetime()
      })

      // Then
      const conseillerTrouve = await ConseillerSqlModel.findByPk(idConseiller)
      expect(conseillerTrouve?.idStructureMilo).to.be.null()
    })
  })

  describe('structureExiste', () => {
    it('retourne true quand la structure Milo est présente dans le référentiel', async () => {
      // Given
      const idStructureMilo = '1'
      await StructureMiloSqlModel.create({
        id: idStructureMilo,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })

      // When
      const existe = await conseillerMiloSqlRepository.structureExiste(
        idStructureMilo
      )
      const existePas = await conseillerMiloSqlRepository.structureExiste(
        'idStructureMilo'
      )

      // Then
      expect(existe).to.be.true()
      expect(existePas).to.be.false()
    })
    it("retourne false quand la structure Milo n'est pas présente dans le référentiel", async () => {
      // When
      const existePas = await conseillerMiloSqlRepository.structureExiste(
        'idStructureMilo'
      )

      // Then
      expect(existePas).to.be.false()
    })
  })
})
