import { uneDatetime } from 'test/fixtures/date.fixture'
import { isSuccess } from '../../src/building-blocks/types/result'
import { Action } from '../../src/domain/action'
import { DateService } from '../../src/utils/date-service'
import { IdService } from '../../src/utils/id-service'
import { uneAction } from '../fixtures/action.fixture'
import { expect, StubbedClass, stubClass } from '../utils'

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

      describe('buildAction', () => {
        describe('Quand le statut est present', () => {
          it('crée une action avec le statut fourni', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'
            const statut = Action.Statut.EN_COURS

            const action: Action = uneAction({
              id,
              dateCreation: nowJs,
              dateDerniereActualisation: nowJs,
              contenu,
              commentaire,
              idJeune,
              statut
            })

            // When
            const actual = actionFactory.buildAction(
              { contenu, idJeune, statut, commentaire },
              { id: action.idCreateur, type: action.typeCreateur }
            )

            // Then
            expect(actual).to.deep.equal({ _isSuccess: true, data: action })
          })
        })

        describe('Quand le statut est absent', () => {
          it('crée une action avec le statut Action.PAS_COMMENCEE par défaut', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'

            const action: Action = uneAction({
              id,
              dateCreation: nowJs,
              dateDerniereActualisation: nowJs,
              statut: Action.Statut.PAS_COMMENCEE,
              contenu,
              commentaire,
              idJeune
            })

            // When
            const actual = actionFactory.buildAction(
              { contenu, idJeune, commentaire },
              { id: action.idCreateur, type: action.typeCreateur }
            )

            // Then
            expect(actual).to.deep.equal({ _isSuccess: true, data: action })
          })
        })
      })
    })
  })
})
