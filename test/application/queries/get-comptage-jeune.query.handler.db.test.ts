import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { GetComptageJeuneQueryHandler } from '../../../src/application/queries/get-comptage-jeune.query.handler.db'

describe('GetComptageJeuneQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  let getComptageJeuneQueryHandler: GetComptageJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

    getComptageJeuneQueryHandler = new GetComptageJeuneQueryHandler(
      jeuneAuthorizer,
      conseillerAuthorizer,
      dateService
    )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe("quand le jeune n'existe pas", () => {
      it('retourne une failure', async () => {
        // When
        const result = await getComptageJeuneQueryHandler.handle({
          idJeune: 't',
          accessToken: 'a'
        })
        // Then
        expect(result).to.deep.equal(failure(new NonTrouveError('Jeune', 't')))
      })
    })
    describe('quand le jeune existe', () => {
      it('retourne un comptage', async () => {
        // Given
        const conseiller = unConseillerDto()
        const jeune = unJeuneDto({ idConseiller: conseiller.id })
        await ConseillerSqlModel.create(conseiller)
        await JeuneSqlModel.create(jeune)
        // When
        const result = await getComptageJeuneQueryHandler.handle({
          idJeune: jeune.id,
          accessToken: 'a'
        })
        // Then
        expect(result).to.deep.equal(
          success({
            nbHeuresDeclarees: 3,
            nbHeuresValidees: 1,
            dateDerniereMiseAJour: uneDatetime().toISO()
          })
        )
      })
    })
  })

  describe('authorize', () => {
    it('Valide le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      const query = {
        idJeune: 'id-jeune',
        accessToken: 'a'
      }

      // When
      await getComptageJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'id-jeune',
        utilisateur
      )
    })
    it('Valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query = {
        idJeune: 'id-jeune',
        accessToken: 'a'
      }

      // When
      await getComptageJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserConseillerPourSonJeune
      ).to.have.been.calledWithExactly('id-jeune', utilisateur)
    })
  })
})
