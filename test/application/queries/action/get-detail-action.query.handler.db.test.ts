import { SinonSandbox } from 'sinon'
import { uneAction, uneActionQualifiee } from 'test/fixtures/action.fixture'
import { ActionAuthorizer } from '../../../../src/application/authorizers/authorize-action'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../../../src/application/queries/action/get-detail-action.query.handler.db'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import {
  uneActionQueryModelFromDomain,
  uneActionQueryModelTermineeAvecQualification
} from '../../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { Action } from '../../../../src/domain/action/action'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { ActionSqlRepository } from '../../../../src/infrastructure/repositories/action/action-sql.repository.db'
import { ConseillerSqlRepository } from '../../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { JeuneSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { IdService } from '../../../../src/utils/id-service'
import { DateService } from '../../../../src/utils/date-service'
import { FirebaseClient } from '../../../../src/infrastructure/clients/firebase-client'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetDetailActionQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let actionSqlRepository: Action.Repository
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let getDetailActionQueryHandler: GetDetailActionQueryHandler
  let sandbox: SinonSandbox
  const jeune = unJeune()

  before(() => {
    databaseForTesting = getDatabase()
    sandbox = createSandbox()
    actionAuthorizer = stubClass(ActionAuthorizer)
    actionSqlRepository = new ActionSqlRepository(new DateService())

    getDetailActionQueryHandler = new GetDetailActionQueryHandler(
      actionAuthorizer
    )
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    let action: Action

    beforeEach(async () => {
      const conseillerRepository = new ConseillerSqlRepository()
      await conseillerRepository.save(unConseiller())
      const firebaseClient = stubClass(FirebaseClient)
      const jeuneRepository = new JeuneSqlRepository(
        databaseForTesting.sequelize,
        firebaseClient,
        new IdService(),
        new DateService()
      )
      await jeuneRepository.save(jeune)
    })

    describe("quand l'action existe", () => {
      describe("quand l'action est qualifiée", () => {
        it('retourne le query model avec le bon état', async () => {
          // Given
          action = uneActionQualifiee({
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE
          })
          await actionSqlRepository.save(action)

          // When
          const actionQueryModel = await getDetailActionQueryHandler.handle({
            idAction: action.id
          })

          // Then
          expect(actionQueryModel).to.deep.equal(
            uneActionQueryModelTermineeAvecQualification(action)
          )
        })
      })
      describe("quand l'action est non terminée", () => {
        it('retourne le query model avec le bon état', async () => {
          // Given
          action = uneAction({
            idJeune: jeune.id,
            statut: Action.Statut.EN_COURS
          })
          await actionSqlRepository.save(action)

          // When
          const actionQueryModel = await getDetailActionQueryHandler.handle({
            idAction: action.id
          })

          // Then
          expect(actionQueryModel).to.deep.equal({
            ...uneActionQueryModelFromDomain(action),
            jeune: {
              id: action.idJeune,
              firstName: jeune.firstName,
              lastName: jeune.lastName
            },
            qualification: undefined
          })
        })
      })
      describe("quand l'action est à qualifier", () => {
        it('retourne le query model avec le bon état', async () => {
          // Given
          action = uneAction({
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE,
            qualification: undefined
          })
          await actionSqlRepository.save(action)

          // When
          const actionQueryModel = await getDetailActionQueryHandler.handle({
            idAction: action.id
          })

          // Then
          expect(actionQueryModel?.etat).to.deep.equal(
            Action.Qualification.Etat.A_QUALIFIER
          )
        })
      })
    })

    describe("quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const result = await getDetailActionQueryHandler.handle({
          idAction: 'b11e5d7b-a046-4e2a-9f78-ac54411593e9'
        })

        // Then
        expect(result).to.equal(undefined)
      })
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDetailActionQuery = {
        idAction: 'id-action'
      }

      // When
      await getDetailActionQueryHandler.authorize(query, utilisateur)

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        'id-action',
        utilisateur
      )
    })
  })
})