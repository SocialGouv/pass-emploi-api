import { DateTime } from 'luxon'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetJeuneHomeActionsQueryHandler } from 'src/application/queries/get-jeune-home-actions.query.handler.db'
import { GetCampagneQueryGetter } from '../../../src/application/queries/query-getters/get-campagne.query.getter.db'
import { Core } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneCampagneQueryModel } from '../../fixtures/campagne.fixture'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../utils'
import Structure = Core.Structure

describe('GetJeuneHomeActionsQueryHandler', () => {
  let getCampagneQueryGetter: StubbedClass<GetCampagneQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler
  let databaseForTesting: DatabaseForTesting

  const idBeneficiaire = 'ABCDE'
  const campagneQueryModel = uneCampagneQueryModel()
  const actionDto = uneActionDto({
    id: 'd2e48a82-c664-455a-b3a5-bb0465a72022',
    idJeune: idBeneficiaire
  })
  const actionsQueryModel = [
    uneActionQueryModel({
      dateEcheance: DateTime.fromJSDate(actionDto.dateEcheance).toISO()
    })
  ]

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(() => {
    getCampagneQueryGetter = stubClass(GetCampagneQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getJeuneHomeActionsQueryHandler = new GetJeuneHomeActionsQueryHandler(
      getCampagneQueryGetter,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    beforeEach(async () => {
      // Given
      const conseillerDto = unConseillerDto()
      const jeuneDto = unJeuneDto({
        id: idBeneficiaire,
        idConseiller: conseillerDto.id
      })

      await databaseForTesting.cleanPG()
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(jeuneDto)
      await ActionSqlModel.creer(actionDto)

      getCampagneQueryGetter.handle
        .withArgs({ idJeune: idBeneficiaire })
        .resolves(campagneQueryModel)
    })

    it('appelle les actions et la campagne en cours et les retourne', async () => {
      // When
      const home = await getJeuneHomeActionsQueryHandler.handle(
        { idJeune: idBeneficiaire },
        unUtilisateurJeune()
      )

      // Then
      expect(home).to.deep.equal({
        actions: actionsQueryModel,
        campagne: campagneQueryModel
      })
    })

    it('récupère la campagne en cours pour un bénéficiaire AIJ', async () => {
      // When
      const home = await getJeuneHomeActionsQueryHandler.handle(
        { idJeune: idBeneficiaire },
        unUtilisateurJeune({ structure: Structure.POLE_EMPLOI_AIJ })
      )

      // Then
      expect(home).to.deep.equal({
        actions: actionsQueryModel,
        campagne: campagneQueryModel
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // When
      await getJeuneHomeActionsQueryHandler.authorize(
        { idJeune: idBeneficiaire },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        idBeneficiaire,
        unUtilisateurJeune()
      )
    })
  })
})
