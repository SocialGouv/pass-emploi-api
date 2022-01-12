import { ConseillerSqlEmailRepository } from '../../../src/infrastructure/repositories/conseiller-sql-email-repository.service'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils'
import { MailSendinblueClient } from '../../../src/infrastructure/repositories/mail-sendinblue.client'

describe('ConseillerSqlRepository', () => {
  DatabaseForTesting.prepare()
  let conseillerSqlRepository: ConseillerSqlEmailRepository
  let mailSendinblueClient: StubbedClass<MailSendinblueClient>

  beforeEach(async () => {
    mailSendinblueClient = stubClass(MailSendinblueClient)
    conseillerSqlRepository = new ConseillerSqlEmailRepository(
      mailSendinblueClient
    )
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

  describe('getQueryModelById', () => {
    it('retourne les conseiller quand le conseiller existe', async () => {
      const idConseiller = '1'
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

  describe('envoyerUnRappelParMail', () => {
    describe('quand le conseiller existe et a un email', () => {
      it('lui envoie un mail', async () => {
        // Given
        const conseiller = unConseiller()
        await conseillerSqlRepository.save(conseiller)

        // When
        await conseillerSqlRepository.envoyerUnRappelParMail(conseiller.id, 5)

        // Then
        expect(mailSendinblueClient.envoyer).to.have.been.calledWith(
          conseiller,
          5
        )
      })
    })
    describe("quand le conseiller n'existe pas", () => {
      it('ne lui envoie pas de mail', async () => {
        // When
        await conseillerSqlRepository.envoyerUnRappelParMail(
          'un-id-inexistant',
          5
        )

        // Then
        expect(mailSendinblueClient.envoyer).to.have.callCount(0)
      })
    })
  })
})
