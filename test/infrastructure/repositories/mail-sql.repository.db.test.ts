import { Core } from '../../../src/domain/core'
import { Mail } from '../../../src/domain/mail'
import { MailSqlRepository } from '../../../src/infrastructure/repositories/mail-sql.repository.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { expect } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('MailSqlRepository', () => {
  let mailSqlRepository: MailSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
    mailSqlRepository = new MailSqlRepository()
  })

  describe('.findAllContactsConseillerByStructure(structure)', () => {
    describe('quand il y a des conseillers MILO et PE', () => {
      it('retourne les conseillers MILO sans PE', async () => {
        // Given
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '1',
            email: 'isabelle.cerutti@pole-emploi.fr',
            nom: 'unNom',
            prenom: 'unPrenom',
            structure: Core.Structure.MILO
          })
        )
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '2',
            email: 'unEmail2',
            nom: 'unNom2',
            prenom: 'unPrenom2',
            structure: Core.Structure.MILO
          })
        )
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '3',
            email: 'unEmail3',
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const actual =
          await mailSqlRepository.findAllContactsConseillerByStructures([
            Core.Structure.MILO
          ])

        // Then
        const expected: Mail.Contact[] = [
          {
            email: 'isabelle.cerutti@francetravail.fr',
            nom: 'unNom',
            prenom: 'unPrenom'
          },
          {
            email: 'unEmail2',
            nom: 'unNom2',
            prenom: 'unPrenom2'
          }
        ]
        expect(actual).to.deep.equal(expected)
      })
    })
    describe("quand il y n'a pas de MILO", () => {
      it('retourne les conseillers MILO sans PE', async () => {
        // Given
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '3',
            email: 'unEmail3',
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const actual =
          await mailSqlRepository.findAllContactsConseillerByStructures([
            Core.Structure.MILO
          ])

        // Then
        expect(actual).to.deep.equal([])
      })
    })
    describe('quand il y a un conseiller MILO sans email', () => {
      it('ne retourne pas le conseiller sans email', async () => {
        // Given
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '1',
            email: null,
            nom: 'unNom',
            prenom: 'unPrenom',
            structure: Core.Structure.MILO
          })
        )

        // When
        const actual =
          await mailSqlRepository.findAllContactsConseillerByStructures([
            Core.Structure.MILO
          ])

        // Then
        expect(actual).to.deep.equal([])
      })
    })
  })
  describe('.countContactsConseillerSansEmail()', () => {
    describe('quand il y a des conseillers MILO et PE sans et avec email', () => {
      it('retourne les conseillers MILO et PE', async () => {
        // Given
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '1',
            email: null,
            nom: 'unNom',
            prenom: 'unPrenom',
            structure: Core.Structure.MILO
          })
        )
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '2',
            email: null,
            nom: 'unNom2',
            prenom: 'unPrenom2',
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '3',
            email: 'unEmail3',
            nom: 'unNom3',
            prenom: 'unPrenom3',
            structure: Core.Structure.MILO
          })
        )
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '4',
            email: 'unEmail3',
            nom: 'unNom4',
            prenom: 'unPrenom4',
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        // When
        const actual =
          await mailSqlRepository.countContactsConseillerSansEmail()

        // Then
        expect(actual).to.be.equal(2)
      })
    })
    describe("quand il n'y a pas de conseillers sans email", () => {
      it('retourne 0', async () => {
        // Given
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '3',
            email: 'unEmail3',
            nom: 'unNom3',
            prenom: 'unPrenom3',
            structure: Core.Structure.MILO
          })
        )
        await ConseillerSqlModel.creer(
          unConseillerDto({
            id: '4',
            email: 'unEmail3',
            nom: 'unNom4',
            prenom: 'unPrenom4',
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        // When
        const actual =
          await mailSqlRepository.countContactsConseillerSansEmail()

        // Then
        expect(actual).to.be.equal(0)
      })
    })
  })
})
