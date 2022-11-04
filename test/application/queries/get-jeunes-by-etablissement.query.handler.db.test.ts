import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { GetJeunesByEtablissementQueryHandler } from 'src/application/queries/get-jeunes-by-etablissement.query.handler.db'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { success } from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { uneAgenceMiloDTO } from '../../fixtures/sql-models/agence.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { ConseillerEtablissementAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-etablissement'

describe('GetJeunesByEtablissementQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let conseillerEtablissementAuthorizer: StubbedClass<ConseillerEtablissementAuthorizer>

  let getJeunesByEtablissementQueryHandler: GetJeunesByEtablissementQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    conseillerEtablissementAuthorizer = stubClass(
      ConseillerEtablissementAuthorizer
    )

    getJeunesByEtablissementQueryHandler =
      new GetJeunesByEtablissementQueryHandler(
        databaseForTesting.sequelize,
        conseillerEtablissementAuthorizer,
        conseillersRepository
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idEtablissement = 'etablissement'

    it("retourne les jeunes d'un établissement", async () => {
      // Given
      await AgenceSqlModel.create(uneAgenceMiloDTO({ id: idEtablissement }))
      await AgenceSqlModel.create(
        uneAgenceMiloDTO({ id: 'autre-etablissement' })
      )

      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '1', idAgence: idEtablissement })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'jeune-conseiller-1',
          idConseiller: '1',
          prenom: 'Alice'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '2', idAgence: idEtablissement })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'jeune-conseiller-2',
          idConseiller: '2',
          prenom: 'Béatrice'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '3', idAgence: 'autre-etablissement' })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({ id: 'jeune-conseiller-3', idConseiller: '3' })
      )

      // When
      const actual = await getJeunesByEtablissementQueryHandler.handle({
        idEtablissement
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          unJeuneQueryModel({ id: 'jeune-conseiller-1', firstName: 'Alice' }),
          unJeuneQueryModel({ id: 'jeune-conseiller-2', firstName: 'Béatrice' })
        ])
      )
    })

    it("retourne tableau vide quand l’établissement n'existe pas", async () => {
      const actual = await getJeunesByEtablissementQueryHandler.handle({
        idEtablissement: 'id-inexistant'
      })

      expect(actual).to.deep.equal(success([]))
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller sur son établissement', () => {
      // Whem
      getJeunesByEtablissementQueryHandler.authorize(
        { idEtablissement: 'paris' },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerEtablissementAuthorizer.authorize
      ).to.have.been.calledWithExactly('paris', unUtilisateurConseiller())
    })
  })
})
