import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/authorize-conseiller'
import { GetJeuneMiloByDossierQueryHandler } from 'src/application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { unJeuneQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('GetJeuneMiloByDossierQueryHandler', () => {
  DatabaseForTesting.prepare()
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getJeuneMiloByDossierQueryHandler: GetJeuneMiloByDossierQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getJeuneMiloByDossierQueryHandler = new GetJeuneMiloByDossierQueryHandler(
      conseillerAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('quand le jeune et le dossier existent', () => {
      it('retourne le jeune', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto({ id: '1' }))
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'test',
            idDossier: '1',
            idConseiller: '1'
          })
        )

        // When
        const actual = await getJeuneMiloByDossierQueryHandler.handle(
          {
            idDossier: '1'
          },
          unUtilisateurConseiller()
        )
        // Then
        expect(actual).to.deep.equal(success(unJeuneQueryModel({ id: 'test' })))
      })
    })
    describe('quand le dossier existe pour un autre conseiller', () => {
      it('retourne une failure', async () => {
        // Given
        const conseillerduJeune = unConseillerDto({ id: '1' })
        await ConseillerSqlModel.creer(conseillerduJeune)

        const unAutreConseiller = unConseillerDto({ id: 'idConseillerAutre' })
        await ConseillerSqlModel.creer(unAutreConseiller)

        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'test',
            idDossier: '1',
            idConseiller: unAutreConseiller.id
          })
        )

        // When
        const actual = await getJeuneMiloByDossierQueryHandler.handle(
          {
            idDossier: '1'
          },
          unUtilisateurConseiller({ id: conseillerduJeune.id })
        )
        // Then
        expect(actual).to.deep.equal(failure(new NonTrouveError('Jeune', '1')))
      })
    })
  })
})
