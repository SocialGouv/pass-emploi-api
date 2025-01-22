import { SinonSandbox } from 'sinon'
import { uneAction, uneActionQualifiee } from 'test/fixtures/action.fixture'
import { ActionAuthorizer } from '../../../../src/application/authorizers/action-authorizer'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../../../src/application/queries/action/get-detail-action.query.handler.db'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
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
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { Core } from '../../../../src/domain/core'

describe('GetDetailActionQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let actionSqlRepository: Action.Repository
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getDetailActionQueryHandler: GetDetailActionQueryHandler
  let sandbox: SinonSandbox
  const jeune = unJeune()

  before(() => {
    databaseForTesting = getDatabase()
    sandbox = createSandbox()
    actionAuthorizer = stubClass(ActionAuthorizer)
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    actionSqlRepository = new ActionSqlRepository(new DateService())

    getDetailActionQueryHandler = new GetDetailActionQueryHandler(
      actionAuthorizer,
      conseillerAgenceAuthorizer
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
            uneActionQueryModelTermineeAvecQualification(action, jeune)
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
            ...uneActionQueryModelFromDomain(action, jeune),
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
    describe('quand c’est un conseiller', () => {
      it('valide le conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })

        const query: GetDetailActionQuery = {
          idAction: 'id-action'
        }

        // When
        await getDetailActionQueryHandler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourUneActionDeSonJeuneOuDUnJeuneDeSonAgenceMilo
        ).to.have.been.calledWithExactly('id-action', utilisateur)
      })
    })
    describe('quand c’est un jeune', () => {
      it('valide le jeune', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()

        const query: GetDetailActionQuery = {
          idAction: 'id-action'
        }

        // When
        await getDetailActionQueryHandler.authorize(query, utilisateur)

        // Then
        expect(
          actionAuthorizer.autoriserPourUneAction
        ).to.have.been.calledWithExactly('id-action', utilisateur)
      })
    })
  })
})
