import { SinonSandbox } from 'sinon'
import { uneAction } from 'test/fixtures/action.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneActionQueryModelFromDomain } from '../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Action } from '../../../src/domain/action'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ActionSqlRepository } from '../../../src/infrastructure/repositories/action-sql.repository.db'
import {
  GetActionsByJeuneQuery,
  GetActionsByJeuneQueryHandler
} from '../../../src/application/queries/get-actions-by-jeune.query.handler.db'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { DateTime } from 'luxon'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository.db'
import { IdService } from '../../../src/utils/id-service'
import { DateService } from '../../../src/utils/date-service'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('GetActionsByJeuneQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let actionSqlRepository: Action.Repository
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    actionSqlRepository = new ActionSqlRepository()
    getActionsByJeuneQueryHandler = new GetActionsByJeuneQueryHandler(
      databaseForTesting.sequelize,
      conseillerForJeuneAuthorizer,
      jeuneAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const jeune = unJeune()

    beforeEach(async () => {
      const conseillerRepository = new ConseillerSqlRepository()
      await conseillerRepository.save(unConseiller())
      const jeuneRepository = new JeuneSqlRepository(
        databaseForTesting.sequelize,
        new IdService(),
        new DateService()
      )
      await jeuneRepository.save(jeune)
    })

    describe("quand aucune action n'existe", () => {
      it('retourne un tableau vide', async () => {
        // When
        const actionsQueryModel = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(actionsQueryModel).to.deep.equal([])
      })
    })
    describe('quand il existe uniquement des actions terminées', () => {
      it('renvoie les actions triées par la plus récente', async () => {
        // Given
        const actionTerminee1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-12T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee3 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-10T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionTerminee1)
        await actionSqlRepository.save(actionTerminee2)
        await actionSqlRepository.save(actionTerminee3)

        // When
        const actionsQueryModel = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(actionsQueryModel).to.deep.equal([
          uneActionQueryModelFromDomain(actionTerminee2),
          uneActionQueryModelFromDomain(actionTerminee3),
          uneActionQueryModelFromDomain(actionTerminee1)
        ])
      })
    })
    describe('quand il existe des actions avec des statuts differents', () => {
      it('renvoie les actions triées par la plus récente', async () => {
        // Given
        const actionPasCommencee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.PAS_COMMENCEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-10T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionEnCours1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionEnCours2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-12T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionPasCommencee)
        await actionSqlRepository.save(actionEnCours1)
        await actionSqlRepository.save(actionEnCours2)

        // When
        const actionsQueryModel = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(actionsQueryModel).to.deep.equal([
          uneActionQueryModelFromDomain(actionEnCours2),
          uneActionQueryModelFromDomain(actionPasCommencee),
          uneActionQueryModelFromDomain(actionEnCours1)
        ])
      })
    })
    describe('quand il existe uniquement des actions pas commencées et en cours', () => {
      it('renvoie les actions triées par la plus récente avec le statut terminé en dernier', async () => {
        // Given
        const actionPasCommencee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.PAS_COMMENCEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-05T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionEnCours = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-08T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionPasCommencee)
        await actionSqlRepository.save(actionEnCours)
        await actionSqlRepository.save(actionTerminee1)
        await actionSqlRepository.save(actionTerminee2)

        // When
        const actionsQueryModel = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(actionsQueryModel).to.deep.equal([
          uneActionQueryModelFromDomain(actionEnCours),
          uneActionQueryModelFromDomain(actionPasCommencee),
          uneActionQueryModelFromDomain(actionTerminee2),
          uneActionQueryModelFromDomain(actionTerminee1)
        ])
      })
    })
  })

  describe('authorize', () => {
    describe("quand c'est un conseiller", () => {
      it('valide le conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()

        const query: GetActionsByJeuneQuery = {
          idJeune: 'id-jeune'
        }

        // When
        await getActionsByJeuneQueryHandler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerForJeuneAuthorizer.authorize
        ).to.have.been.calledWithExactly('id-jeune', utilisateur)
      })
    })

    describe("quand c'est un jeune", () => {
      it('valide le jeune', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()

        const query: GetActionsByJeuneQuery = {
          idJeune: 'id-jeune'
        }

        // When
        await getActionsByJeuneQueryHandler.authorize(query, utilisateur)

        // Then
        expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
          'id-jeune',
          utilisateur
        )
      })
    })
  })
})
