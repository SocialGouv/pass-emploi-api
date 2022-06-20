import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  GetConseillerByEmailQuery,
  GetConseillerByEmailQueryHandler
} from '../../../src/application/queries/get-conseiller-by-email.query.handler.db'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../utils'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'

describe('GetConseillerByEmailQueryHandler', () => {
  DatabaseForTesting.prepare()
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getConseillerByEmail: GetConseillerByEmailQueryHandler

  beforeEach(() => {
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getConseillerByEmail = new GetConseillerByEmailQueryHandler(
      conseillerAuthorizer
    )
  })

  const structure = Core.Structure.POLE_EMPLOI

  describe('handle', () => {
    let email: string
    let conseillerDto: AsSql<ConseillerDto>

    beforeEach(async () => {
      // Given
      email = 'conseiller@email.fr'
      conseillerDto = unConseillerDto({
        prenom: 'toto',
        nom: 'tata',
        email: email
      })
      await ConseillerSqlModel.creer(conseillerDto)
    })

    it('retourne le conseiller quand le conseiller existe', async () => {
      // When
      const actual = await getConseillerByEmail.handle({
        emailConseiller: email,
        structureUtilisateur: Core.Structure.PASS_EMPLOI
      })

      expect(actual).to.deep.equal(
        success(
          detailConseillerQueryModel({
            id: conseillerDto.id,
            firstName: 'toto',
            lastName: 'tata',
            email: 'conseiller@email.fr',
            agence: undefined
          })
        )
      )
    })

    it('retourne un conseiller avec des jeunes à récupérer', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({ idConseillerInitial: conseillerDto.id })
      )
      // When
      const actual = await getConseillerByEmail.handle({
        emailConseiller: email,
        structureUtilisateur: Core.Structure.PASS_EMPLOI
      })

      expect(actual).to.deep.equal(
        success(
          detailConseillerQueryModel({
            id: conseillerDto.id,
            firstName: 'toto',
            lastName: 'tata',
            email: 'conseiller@email.fr',
            agence: undefined,
            aDesBeneficiairesARecuperer: true
          })
        )
      )
    })

    it("retourne un échec quand le conseiller n'existe pas avec cet email", async () => {
      const actual = await getConseillerByEmail.handle({
        emailConseiller: 'inexistant@email.com',
        structureUtilisateur: Core.Structure.PASS_EMPLOI
      })

      expect(actual).to.deep.equal(
        failure(new NonTrouveError('Conseiller', 'inexistant@email.com'))
      )
    })

    it("retourne un échec quand le conseiller n'existe pas avec cette structure", async () => {
      const actual = await getConseillerByEmail.handle({
        emailConseiller: email,
        structureUtilisateur: Core.Structure.MILO
      })

      expect(actual).to.deep.equal(
        failure(new NonTrouveError('Conseiller', email))
      )
    })
  })

  describe('authorize', () => {
    it('interdit le conseiller non superviseur', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ roles: [] })
      const query: GetConseillerByEmailQuery = {
        emailConseiller: 'whatever@email.fr',
        structureUtilisateur: structure
      }

      // When
      await getConseillerByEmail.authorize(query, utilisateur)

      // Then
      expect(conseillerAuthorizer.authorizeSuperviseur).to.have.been.calledWith(
        utilisateur
      )
    })
  })
})
