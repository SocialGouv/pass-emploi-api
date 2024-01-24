import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess } from 'src/building-blocks/types/result'
import { uneAction } from 'test/fixtures/action.fixture'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import {
  GetActionsJeuneQuery,
  GetActionsJeuneQueryHandler
} from '../../../../src/application/queries/action/get-actions-jeune.query.handler.db'
import { ActionQueryModel } from '../../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../../src/domain/action/action'
import { Core } from '../../../../src/domain/core'
import { FirebaseClient } from '../../../../src/infrastructure/clients/firebase-client'
import { ActionSqlRepository } from '../../../../src/infrastructure/repositories/action/action-sql.repository.db'
import { ConseillerSqlRepository } from '../../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { JeuneSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { DateService } from '../../../../src/utils/date-service'
import { IdService } from '../../../../src/utils/id-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { uneActionQueryModelFromDomain } from '../../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetActionsByJeuneQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let actionSqlRepository: Action.Repository
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getActionsByJeuneQueryHandler: GetActionsJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    databaseForTesting = getDatabase()
    sandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    actionSqlRepository = new ActionSqlRepository(new DateService())
    getActionsByJeuneQueryHandler = new GetActionsJeuneQueryHandler(
      databaseForTesting.sequelize,
      jeuneAuthorizer,
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
        })
        const actionTerminee2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-12T12:00:00.000Z'
          )
        })
        const actionTerminee3 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-10T12:00:00.000Z'
          )
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
            uneActionQueryModelFromDomain(
              actionTerminee2,
              Action.Qualification.Etat.A_QUALIFIER
            ),
            uneActionQueryModelFromDomain(
              actionTerminee3,
              Action.Qualification.Etat.A_QUALIFIER
            ),
            uneActionQueryModelFromDomain(
              actionTerminee1,
              Action.Qualification.Etat.A_QUALIFIER
            )
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
        })
        const actionEnCours1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
        })
        const actionEnCours2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-12T12:00:00.000Z'
          )
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
        })
        const actionEnCours = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
        })
        const actionTerminee1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
        })
        const actionTerminee2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-08T12:00:00.000Z'
          )
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
            uneActionQueryModelFromDomain(
              actionTerminee2,
              Action.Qualification.Etat.A_QUALIFIER
            ),
            uneActionQueryModelFromDomain(
              actionTerminee1,
              Action.Qualification.Etat.A_QUALIFIER
            )
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
          dateCreation: DateTime.fromISO('2020-04-05T12:00:00.000Z')
        })
        const actionEnCours = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateCreation: DateTime.fromISO('2020-04-06T12:00:00.000Z')
        })
        const actionCanceled = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.ANNULEE,
          dateCreation: DateTime.fromISO('2020-04-07T12:00:00.000Z')
        })
        const actionTermineeRecente = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateCreation: DateTime.fromISO('2020-04-03T12:00:00.000Z')
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
            uneActionQueryModelFromDomain(
              actionTermineeRecente,
              Action.Qualification.Etat.A_QUALIFIER
            ),
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
        })
        const actionEnCours = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
        })
        const actionCanceled = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.ANNULEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
        })
        const actionTerminee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-08T12:00:00.000Z'
          )
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
            uneActionQueryModelFromDomain(
              actionTerminee,
              Action.Qualification.Etat.A_QUALIFIER
            )
          ])
        }
      })
    })

    describe('quand on filtre', () => {
      describe('etat', () => {
        let actionNonQualifiable: Action
        let actionAQualifier: Action
        let actionQualifiee: Action

        let actionQMNonQualifiable: ActionQueryModel
        let actionQMAQualifier: ActionQueryModel
        let actionQMQualifiee: ActionQueryModel

        beforeEach(async () => {
          // Given
          actionNonQualifiable = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120001',
            idJeune: jeune.id,
            statut: Action.Statut.PAS_COMMENCEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-05T12:00:00.000Z'
            )
          })
          actionAQualifier = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120002',
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE,
            qualification: undefined,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-06T12:00:00.000Z'
            )
          })
          actionQualifiee = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120003',
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE,
            qualification: {
              code: Action.Qualification.Code.SANTE,
              heures: 2,
              commentaire: 'Un commentaire'
            },
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-07T12:00:00.000Z'
            )
          })

          actionQMNonQualifiable = uneActionQueryModelFromDomain(
            actionNonQualifiable,
            Action.Qualification.Etat.NON_QUALIFIABLE
          )
          actionQMQualifiee = uneActionQueryModelFromDomain(
            actionQualifiee,
            Action.Qualification.Etat.QUALIFIEE,
            {
              code: Action.Qualification.Code.SANTE,
              heures: 2,
              libelle: 'Santé',
              commentaireQualification: 'Un commentaire'
            }
          )
          actionQMAQualifier = uneActionQueryModelFromDomain(
            actionAQualifier,
            Action.Qualification.Etat.A_QUALIFIER
          )

          await actionSqlRepository.save(actionNonQualifiable)
          await actionSqlRepository.save(actionAQualifier)
          await actionSqlRepository.save(actionQualifiee)
        })

        it('filtre les non qualifiables', async () => {
          // When
          const result = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id,
            page: 1,
            etats: [Action.Qualification.Etat.NON_QUALIFIABLE]
          })

          // Then
          expect(isSuccess(result) && result.data.actions).to.deep.equal([
            actionQMNonQualifiable
          ])
        })

        it('filtre les qualifiées', async () => {
          // When
          const result = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id,
            page: 1,
            etats: [Action.Qualification.Etat.QUALIFIEE]
          })

          // Then
          expect(isSuccess(result) && result.data.actions).to.deep.equal([
            actionQMQualifiee
          ])
        })

        it('filtre les à qualifier', async () => {
          // When
          const result = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id,
            page: 1,
            etats: [Action.Qualification.Etat.A_QUALIFIER]
          })

          // Then
          expect(isSuccess(result) && result.data.actions).to.deep.equal([
            actionQMAQualifier
          ])
        })

        it('filtre tout', async () => {
          // When
          const result = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id,
            page: 1,
            etats: [
              Action.Qualification.Etat.A_QUALIFIER,
              Action.Qualification.Etat.QUALIFIEE,
              Action.Qualification.Etat.NON_QUALIFIABLE
            ]
          })

          // Then
          expect(
            isSuccess(result) && result.data.actions
          ).to.deep.include.members([
            actionQMNonQualifiable,
            actionQMQualifiee,
            actionQMAQualifier
          ])
        })
      })

      describe('statut', () => {
        const actionPasCommencee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.PAS_COMMENCEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-05T12:00:00.000Z'
          )
        })
        const actionEnCours = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
        })
        const actionCanceled = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.ANNULEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
        })
        const actionTerminee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-08T12:00:00.000Z'
          )
        })
        beforeEach(async () => {
          // Given
          await actionSqlRepository.save(actionPasCommencee)
          await actionSqlRepository.save(actionEnCours)
          await actionSqlRepository.save(actionCanceled)
          await actionSqlRepository.save(actionTerminee)
        })

        it("applique les filtres de statut d'action et donne le nombre total de résultats", async () => {
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
            expect(result.data.metadonnees.nombreTotal).to.equal(4)
          }
        })

        it('intersecte avec les filtres d’état de qualification', async () => {
          // When
          const result1 = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id,
            page: 1,
            statuts: [Action.Statut.TERMINEE],
            etats: [Action.Qualification.Etat.NON_QUALIFIABLE]
          })
          // Then
          expect(isSuccess(result1)).to.be.true()
          if (isSuccess(result1)) {
            expect(result1.data.actions).to.be.deep.equal([])
            expect(result1.data.metadonnees.nombreTotal).to.equal(4)
          }

          // When
          const result2 = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id,
            page: 1,
            statuts: [Action.Statut.EN_COURS, Action.Statut.PAS_COMMENCEE],
            etats: [Action.Qualification.Etat.A_QUALIFIER]
          })
          // Then
          expect(isSuccess(result2)).to.be.true()
          if (isSuccess(result2)) {
            expect(result2.data.actions).to.be.deep.equal([])
            expect(result2.data.metadonnees.nombreTotal).to.equal(4)
          }
        })
      })
    })

    context('metadata', () => {
      describe('quand on a des actions de chaque statut', () => {
        it('renvoie le compte des actions par statut et par état', async () => {
          // Given
          const actionPasCommencee = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120001',
            idJeune: jeune.id,
            statut: Action.Statut.PAS_COMMENCEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-10T12:00:00.000Z'
            )
          })
          const actionEnCours1 = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120002',
            idJeune: jeune.id,
            statut: Action.Statut.EN_COURS,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-06T12:00:00.000Z'
            )
          })
          const actionEnCours2 = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120003',
            idJeune: jeune.id,
            statut: Action.Statut.EN_COURS,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-06T12:00:00.000Z'
            )
          })
          const actionTerminee = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120004',
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-12T12:00:00.000Z'
            )
          })
          const actionQualifiee = uneAction({
            id: '199045ac-301d-11ed-a644-9b2ecb31ab40',
            idJeune: jeune.id,
            statut: Action.Statut.TERMINEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-12T12:00:00.000Z'
            ),
            qualification: {
              code: Action.Qualification.Code.CITOYENNETE,
              heures: 5,
              commentaire: 'Un commentaire'
            }
          })
          const actionAnnulee = uneAction({
            id: '02b3710e-7779-11ec-90d6-0242ac120005',
            idJeune: jeune.id,
            statut: Action.Statut.ANNULEE,
            dateDerniereActualisation: DateTime.fromISO(
              '2020-04-12T12:00:00.000Z'
            )
          })

          await actionSqlRepository.save(actionPasCommencee)
          await actionSqlRepository.save(actionEnCours1)
          await actionSqlRepository.save(actionEnCours2)
          await actionSqlRepository.save(actionTerminee)
          await actionSqlRepository.save(actionQualifiee)
          await actionSqlRepository.save(actionAnnulee)

          // When
          const result = await getActionsByJeuneQueryHandler.handle({
            idJeune: jeune.id
          })

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data.metadonnees).to.deep.equal({
              nombreTotal: 6,
              nombrePasCommencees: 1,
              nombreEnCours: 2,
              nombreTerminees: 2,
              nombreAnnulees: 1,
              nombreNonQualifiables: 4,
              nombreAQualifier: 1,
              nombreQualifiees: 1,
              nombreActionsParPage: 10
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
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })

        const query: GetActionsJeuneQuery = {
          idJeune: 'id-jeune'
        }

        // When
        await getActionsByJeuneQueryHandler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
        ).to.have.been.calledWithExactly('id-jeune', utilisateur)
      })
    })

    describe("quand c'est un jeune", () => {
      it('valide le jeune', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()

        const query: GetActionsJeuneQuery = {
          idJeune: 'id-jeune'
        }

        // When
        await getActionsByJeuneQueryHandler.authorize(query, utilisateur)

        // Then
        expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
          'id-jeune',
          utilisateur
        )
      })
    })
  })
})
