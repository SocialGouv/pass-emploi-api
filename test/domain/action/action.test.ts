import { uneDatetime } from 'test/fixtures/date.fixture'
import { isFailure, isSuccess } from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action/action'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { uneAction } from '../../fixtures/action.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unJeune } from '../../fixtures/jeune.fixture'
import { DateTime } from 'luxon'

describe('Action', () => {
  describe('Factory', () => {
    let actionFactory: Action.Factory
    let idService: StubbedClass<IdService>
    let dateService: StubbedClass<DateService>
    const id = '26279b34-318a-45e4-a8ad-514a1090462c'
    const nowJs = uneDatetime.toJSDate()

    beforeEach(() => {
      idService = stubClass(IdService)
      idService.uuid.returns(id)
      dateService = stubClass(DateService)
      dateService.nowJs.returns(nowJs)
      dateService.now.returns(uneDatetime)
      actionFactory = new Action.Factory(idService, dateService)
    })

    describe('updateStatut', () => {
      describe('quand le statut est fourni', () => {
        it("renvoie l'action avec le statut et la date à jour", async () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.PAS_COMMENCEE
          })
          const enCours = Action.Statut.EN_COURS

          // When
          const resultAction = actionFactory.updateStatut(action, enCours)

          // Then
          expect(isSuccess(resultAction)).to.equal(true)
          if (isSuccess(resultAction)) {
            expect(resultAction.data.statut).to.equal(enCours)
            expect(resultAction.data.dateDerniereActualisation).to.equal(nowJs)
          }
        })
      })
    })
    describe('buildAction', () => {
      const dateEcheance = DateTime.fromISO(
        '2020-02-02T00:00:00.000Z'
      ).toJSDate()

      const dateEcheanceA9h30 = DateTime.fromISO(
        '2020-02-02T09:30:00.000Z'
      ).toJSDate()
      describe('Quand le statut est present', () => {
        describe('quand le conseiller est le créateur', () => {
          it('crée une action avec le statut fourni', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'
            const statut = Action.Statut.EN_COURS
            const typeCreateur = Action.TypeCreateur.CONSEILLER

            const jeune = unJeune()

            const expectedAction: Action = uneAction({
              id,
              dateCreation: nowJs,
              dateDerniereActualisation: nowJs,
              contenu,
              description: commentaire,
              idJeune,
              statut,
              createur: {
                id: jeune.conseiller.id,
                prenom: jeune.conseiller.firstName,
                nom: jeune.conseiller.lastName,
                type: Action.TypeCreateur.CONSEILLER
              },
              dateEcheance: dateEcheanceA9h30,
              rappel: true
            })

            // When
            const actual = actionFactory.buildAction(
              {
                contenu,
                idJeune,
                statut,
                commentaire,
                typeCreateur,
                dateEcheance: dateEcheance
              },
              jeune
            )

            // Then
            expect(actual).to.deep.equal({
              _isSuccess: true,
              data: expectedAction
            })
          })
        })
        describe('quand le jeune est le créateur', () => {
          it('crée une action avec le statut fourni', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'
            const statut = Action.Statut.TERMINEE
            const typeCreateur = Action.TypeCreateur.JEUNE

            const jeune = unJeune()

            const action: Action = uneAction({
              id,
              dateCreation: nowJs,
              dateDerniereActualisation: nowJs,
              contenu,
              description: commentaire,
              idJeune,
              statut,
              createur: {
                id: jeune.id,
                prenom: jeune.firstName,
                nom: jeune.lastName,
                type: Action.TypeCreateur.JEUNE
              },
              dateEcheance: dateEcheanceA9h30,
              rappel: true
            })

            // When
            const actual = actionFactory.buildAction(
              {
                contenu,
                idJeune,
                statut,
                commentaire,
                typeCreateur,
                dateEcheance
              },
              jeune
            )

            // Then
            expect(actual).to.deep.equal({ _isSuccess: true, data: action })
          })
          it('crée une action avec rappel fournis', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'
            const statut = Action.Statut.TERMINEE
            const typeCreateur = Action.TypeCreateur.JEUNE
            const rappel = false

            const jeune = unJeune()

            const action: Action = uneAction({
              id,
              dateCreation: nowJs,
              dateDerniereActualisation: nowJs,
              contenu,
              description: commentaire,
              idJeune,
              statut,
              createur: {
                id: jeune.id,
                prenom: jeune.firstName,
                nom: jeune.lastName,
                type: Action.TypeCreateur.JEUNE
              },
              dateEcheance: dateEcheanceA9h30,
              rappel
            })

            // When
            const actual = actionFactory.buildAction(
              {
                contenu,
                idJeune,
                statut,
                commentaire,
                typeCreateur,
                dateEcheance,
                rappel
              },
              jeune
            )

            // Then
            expect(actual).to.deep.equal({ _isSuccess: true, data: action })
          })
        })
      })
      describe('Quand le statut est absent', () => {
        it('crée une action avec le statut PAS_COMMENCEE par défaut', async () => {
          // Given
          const contenu = 'test'
          const idJeune = '1'
          const commentaire = 'test'
          const typeCreateur = Action.TypeCreateur.JEUNE

          const jeune = unJeune()

          const action: Action = uneAction({
            id,
            dateCreation: nowJs,
            dateDerniereActualisation: nowJs,
            contenu,
            description: commentaire,
            idJeune,
            statut: Action.Statut.PAS_COMMENCEE,
            createur: {
              id: jeune.id,
              prenom: jeune.firstName,
              nom: jeune.lastName,
              type: Action.TypeCreateur.JEUNE
            },
            dateEcheance: dateEcheanceA9h30,
            rappel: true
          })

          // When
          const actual = actionFactory.buildAction(
            { contenu, idJeune, commentaire, typeCreateur, dateEcheance },
            jeune
          )

          // Then
          expect(actual).to.deep.equal({ _isSuccess: true, data: action })
        })
      })
    })
    describe('doitPlanifierUneNotificationDeRappel', () => {
      describe('quand il faut planifier un rappel', () => {
        it('renvoie vrai', () => {
          // Given
          const action: Action = uneAction({
            rappel: true,
            statut: Action.Statut.PAS_COMMENCEE,
            dateEcheance: uneDatetime.plus({ day: 4 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitPlanifierUneNotificationDeRappel(action)

          // Then
          expect(result).to.be.true()
        })
      })
      describe('quand le statut est annulé', () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: true,
            statut: Action.Statut.ANNULEE,
            dateEcheance: uneDatetime.plus({ day: 4 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitPlanifierUneNotificationDeRappel(action)

          // Then
          expect(result).to.be.false()
        })
      })
      describe('quand le statut est terminé', () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: true,
            statut: Action.Statut.TERMINEE,
            dateEcheance: uneDatetime.plus({ day: 4 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitPlanifierUneNotificationDeRappel(action)

          // Then
          expect(result).to.be.false()
        })
      })
      describe("quand l'action est sans rappel", () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: false,
            statut: Action.Statut.PAS_COMMENCEE,
            dateEcheance: uneDatetime.plus({ day: 4 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitPlanifierUneNotificationDeRappel(action)

          // Then
          expect(result).to.be.false()
        })
      })
      describe("quand la date d'échéance de l'action est dans moins de 4 jours", () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: false,
            statut: Action.Statut.PAS_COMMENCEE,
            dateEcheance: uneDatetime.plus({ day: 2 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitPlanifierUneNotificationDeRappel(action)

          // Then
          expect(result).to.be.false()
        })
      })
    })
    describe('doitEnvoyerUneNotificationDeRappel', () => {
      describe('quand il faut envoyer un rappel', () => {
        it('renvoie vrai', () => {
          // Given
          const action: Action = uneAction({
            rappel: true,
            statut: Action.Statut.PAS_COMMENCEE,
            dateEcheance: uneDatetime.plus({ day: 3 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitEnvoyerUneNotificationDeRappel(action)

          // Then
          expect(isSuccess(result)).to.be.true()
        })
      })
      describe('quand le statut est annulé', () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: true,
            statut: Action.Statut.ANNULEE,
            dateEcheance: uneDatetime.plus({ day: 3 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitEnvoyerUneNotificationDeRappel(action)

          // Then
          expect(isFailure(result)).to.be.true()
        })
      })
      describe('quand le statut est terminé', () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: true,
            statut: Action.Statut.TERMINEE,
            dateEcheance: uneDatetime.plus({ day: 3 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitEnvoyerUneNotificationDeRappel(action)

          // Then
          expect(isFailure(result)).to.be.true()
        })
      })
      describe("quand l'action est sans rappel", () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: false,
            statut: Action.Statut.PAS_COMMENCEE,
            dateEcheance: uneDatetime.plus({ day: 4 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitEnvoyerUneNotificationDeRappel(action)

          // Then
          expect(isFailure(result)).to.be.true()
        })
      })
      describe("quand la date d'échéance de l'action est dans moins de 3 jours", () => {
        it('renvoie faux', () => {
          // Given
          const action: Action = uneAction({
            rappel: false,
            statut: Action.Statut.PAS_COMMENCEE,
            dateEcheance: uneDatetime.plus({ day: 2 }).toJSDate()
          })

          // When
          const result =
            actionFactory.doitEnvoyerUneNotificationDeRappel(action)

          // Then
          expect(isFailure(result)).to.be.true()
        })
      })
    })
  })
})
