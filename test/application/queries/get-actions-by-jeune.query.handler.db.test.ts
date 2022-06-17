import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess } from 'src/building-blocks/types/result'
import { uneAction } from 'test/fixtures/action.fixture'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  GetActionsByJeuneQuery,
  GetActionsByJeuneQueryHandler
} from '../../../src/application/queries/get-actions-by-jeune.query.handler.db'
import { Action } from '../../../src/domain/action'
import { ActionSqlRepository } from '../../../src/infrastructure/repositories/action-sql.repository.db'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository.db'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneActionQueryModelFromDomain } from '../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'

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
      const firebaseClient = stubClass(FirebaseClient)
      const jeuneRepository = new JeuneSqlRepository(
        databaseForTesting.sequelize,
        firebaseClient,
        new IdService(),
        new DateService()
      )
      await jeuneRepository.save(jeune)
    })

    describe("quand aucune action n'existe", () => {
      it('retourne un tableau vide et 0 résultat', async () => {
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.empty()
        }
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
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionTerminee2),
            uneActionQueryModelFromDomain(actionTerminee3),
            uneActionQueryModelFromDomain(actionTerminee1)
          ])
        }
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
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionEnCours2),
            uneActionQueryModelFromDomain(actionPasCommencee),
            uneActionQueryModelFromDomain(actionEnCours1)
          ])
        }
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
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id
        })

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionEnCours),
            uneActionQueryModelFromDomain(actionPasCommencee),
            uneActionQueryModelFromDomain(actionTerminee2),
            uneActionQueryModelFromDomain(actionTerminee1)
          ])
        }
      })
    })
    describe('quand le numéro de page demandé est supérieur à la dernière page', () => {
      it('renvoie une failure', async () => {
        // When
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id,
          page: 2
        })
        // Then
        expect(result).to.deep.equal(failure(new NonTrouveError('Page', '2')))
      })
    })
    describe("quand il n'existe pas d'actions et qu'on demande la première page", () => {
      it('retourne un tableau vide et 0 résultat', async () => {
        // When
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id,
          page: 1
        })
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.empty()
        }
      })
    })
    describe('quand il existe plus de 10 actions', () => {
      it('retourne les actions de la bonne page et le nombre total de résultats', async () => {
        // Given
        for (let i = 0; i < 10; i++) {
          const actionPage1 = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac12000' + i,
            idJeune: jeune.id,
            statut: Action.Statut.PAS_COMMENCEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-05T12:00:00.000Z'
            )
              .toUTC()
              .toJSDate()
          })
          await actionSqlRepository.save(actionPage1)
        }
        const actionPage2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120010',
          idJeune: jeune.id,
          statut: Action.Statut.PAS_COMMENCEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-05T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionPage2)

        // When
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id,
          page: 2
        })
        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionPage2)
          ])
          expect(result.data.metadonnees.nombreTotal).to.equal(11)
        }
      })
    })
    describe('quand on trie', () => {
      it('applique le tri par date croissante uniquement', async () => {
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
        const actionCanceled = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.ANNULEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTermineeRecente = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-03T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionPasCommencee)
        await actionSqlRepository.save(actionEnCours)
        await actionSqlRepository.save(actionCanceled)
        await actionSqlRepository.save(actionTermineeRecente)

        // When
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id,
          page: 1,
          tri: Action.Tri.DATE_CROISSANTE
        })

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionTermineeRecente),
            uneActionQueryModelFromDomain(actionPasCommencee),
            uneActionQueryModelFromDomain(actionEnCours),
            uneActionQueryModelFromDomain(actionCanceled)
          ])
        }
      })
      it('applique le tri par date décroissante par défaut', async () => {
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
        const actionCanceled = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.ANNULEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee = uneAction({
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
        await actionSqlRepository.save(actionCanceled)
        await actionSqlRepository.save(actionTerminee)

        // When
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id,
          page: 1
        })

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionCanceled),
            uneActionQueryModelFromDomain(actionEnCours),
            uneActionQueryModelFromDomain(actionPasCommencee),
            uneActionQueryModelFromDomain(actionTerminee)
          ])
        }
      })
    })
    describe('quand on filtre', () => {
      it("applique les filtres de statut d'action et donne le nombre total de résultats filtrés", async () => {
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
        const actionCanceled = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.ANNULEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee = uneAction({
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
        await actionSqlRepository.save(actionCanceled)
        await actionSqlRepository.save(actionTerminee)

        // When
        const result = await getActionsByJeuneQueryHandler.handle({
          idJeune: jeune.id,
          page: 1,
          statuts: [Action.Statut.EN_COURS, Action.Statut.PAS_COMMENCEE]
        })

        // Then
        expect(isSuccess(result)).to.be.true()
        if (isSuccess(result)) {
          expect(result.data.actions).to.be.deep.equal([
            uneActionQueryModelFromDomain(actionEnCours),
            uneActionQueryModelFromDomain(actionPasCommencee)
          ])
          expect(result.data.metadonnees.nombreTotal).to.equal(2)
        }
      })
    })

    context('metadata', () => {
      describe('quand on a des actions de chaque statut', () => {
        it('renvoie le compte des actions par statut', async () => {
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
              '2020-04-06T12:00:00.000Z'
            )
              .toUTC()
              .toJSDate()
          })
          const actionTerminee = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120004',
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-12T12:00:00.000Z'
            )
              .toUTC()
              .toJSDate()
          })

          const actionAnnulee = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120005',
            idJeune: jeune.id,
            statut: Action.Statut.ANNULEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-12T12:00:00.000Z'
            )
              .toUTC()
              .toJSDate()
          })
          await actionSqlRepository.save(actionPasCommencee)
          await actionSqlRepository.save(actionEnCours1)
          await actionSqlRepository.save(actionEnCours2)
          await actionSqlRepository.save(actionTerminee)
          await actionSqlRepository.save(actionAnnulee)

          // When
          const result = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id
          })

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data.metadonnees).to.deep.equal({
              nombreTotal: 5,
              nombreEnCours: 2,
              nombreTermine: 1,
              nombreAnnule: 1,
              nombrePasCommence: 1,
              nombreElementsParPage: 10
            })
          }
        })
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
