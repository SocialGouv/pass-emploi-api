import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'

import { uneDatetime } from 'test/fixtures/date.fixture'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { expect } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('ConseillerSqlRepository', () => {
  let conseillerSqlRepository: ConseillerSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
    conseillerSqlRepository = new ConseillerSqlRepository()
  })

  describe('get', () => {
    it('retourne le conseiller', async () => {
      // Given
      const conseiller: Conseiller = {
        id: '1',
        lastName: 'Tavernier',
        firstName: 'Nils',
        structure: Core.Structure.POLE_EMPLOI,
        email: 'nils.tavernier@passemploi.com',
        notificationsSonores: false,
        agence: {
          id: 'id'
        },
        dateSignatureCGU: undefined,
        dateVisionnageActus: undefined
      }
      await AgenceSqlModel.create({
        id: 'id',
        nomAgence: 'nom',
        nomRegion: 'nomRegion',
        codeDepartement: 'codeDepartement',
        structure: 'MILO',
        timezone: 'Paris'
      })
      await conseillerSqlRepository.save(conseiller)

      // When
      const result = await conseillerSqlRepository.get(conseiller.id)

      // Then
      const expected: Conseiller = {
        id: '1',
        lastName: 'Tavernier',
        firstName: 'Nils',
        structure: Core.Structure.POLE_EMPLOI,
        email: 'nils.tavernier@passemploi.com',
        agence: {
          id: 'id',
          nom: 'nom'
        },
        notificationsSonores: false
      }
      expect(result).to.deep.equal(expected)
    })
  })

  describe('getByIdAuthentification', () => {
    it('retourne le conseiller', async () => {
      // Given
      const conseiller: Conseiller = {
        id: '1',
        lastName: 'Tavernier',
        firstName: 'Nils',
        structure: Core.Structure.POLE_EMPLOI,
        email: 'nils.tavernier@passemploi.com',
        notificationsSonores: false,
        agence: {
          id: 'id'
        },
        dateSignatureCGU: undefined,
        dateVisionnageActus: undefined
      }
      await AgenceSqlModel.create({
        id: 'id',
        nomAgence: 'nom',
        nomRegion: 'nomRegion',
        codeDepartement: 'codeDepartement',
        structure: 'MILO',
        timezone: 'Paris'
      })
      await conseillerSqlRepository.save(conseiller)
      await ConseillerSqlModel.update(
        {
          idAuthentification: 'id-authentification'
        },
        { where: { id: conseiller.id } }
      )

      // When
      const result = await conseillerSqlRepository.getByIdAuthentification(
        'id-authentification'
      )

      // Then
      const expected: Conseiller = {
        id: '1',
        lastName: 'Tavernier',
        firstName: 'Nils',
        structure: Core.Structure.POLE_EMPLOI,
        email: 'nils.tavernier@passemploi.com',
        agence: {
          id: 'id',
          nom: 'nom'
        },
        notificationsSonores: false
      }
      expect(result).to.deep.equal(expected)
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
      const dateMaintenant = uneDatetime()
      const dateHier = uneDatetime().minus({ day: 1 }).toJSDate()
      const dateRechercheAujourdhui = uneDatetime()
        .minus({ minute: 1 })
        .toJSDate()
      const ilYaUnMois = dateMaintenant.minus({ month: 1 }).toJSDate()
      const ilYa4Mois = dateMaintenant.minus({ months: 4 }).toJSDate()

      const conseillerAvecMessagesNonVerifies = unConseillerDto({
        id: '1',
        dateVerificationMessages: dateHier,
        dateDerniereConnexion: ilYaUnMois
      })
      const conseillerAvecMessagesNonVerifiesMaisPasConnecte = unConseillerDto({
        id: '11',
        dateVerificationMessages: dateHier,
        dateDerniereConnexion: ilYa4Mois
      })
      const conseillerAvecMessagesVerifiesAujourdhui = unConseillerDto({
        id: '2',
        dateVerificationMessages: dateRechercheAujourdhui,
        dateDerniereConnexion: ilYaUnMois
      })
      const conseillerAvecMessagesDejaVerifies = unConseillerDto({
        id: '3',
        dateVerificationMessages: dateMaintenant.toJSDate(),
        dateDerniereConnexion: ilYaUnMois
      })

      await ConseillerSqlModel.bulkCreate([
        conseillerAvecMessagesNonVerifies,
        conseillerAvecMessagesNonVerifiesMaisPasConnecte,
        conseillerAvecMessagesVerifiesAujourdhui,
        conseillerAvecMessagesDejaVerifies
      ])

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

  describe('updateDateVerificationMessages', () => {
    it('met a jour avec la date', async () => {
      // Given
      const dateMaintenant = uneDatetime()
      const dateHier = uneDatetime().minus({ day: 1 })

      const conseillerAvecMessagesNonVerifies = unConseiller({
        id: '1',
        dateVerificationMessages: dateHier
      })

      await conseillerSqlRepository.save(conseillerAvecMessagesNonVerifies)

      // When
      await conseillerSqlRepository.updateDateVerificationMessages(
        conseillerAvecMessagesNonVerifies.id,
        dateMaintenant.toJSDate()
      )

      // Then
      const conseilerMisAJour = await ConseillerSqlModel.findByPk(
        conseillerAvecMessagesNonVerifies.id
      )
      expect(conseilerMisAJour?.dateVerificationMessages).to.be.deep.equal(
        dateMaintenant.toJSDate()
      )
    })
  })
})
