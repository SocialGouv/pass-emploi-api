import { uneDatetime } from 'test/fixtures/date.fixture'
import { failure } from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { uneAction } from '../../fixtures/action.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('Action', () => {
  describe('.updateStatut(updateStatut)', () => {
    describe('Quand le nouveau statut est fourni', () => {
      it("met à jour le statut de l'action", async () => {
        // Given
        const action = uneAction({
          statut: Action.Statut.PAS_COMMENCEE
        })
        const enCours = Action.Statut.EN_COURS

        // When
        action.updateStatut({ statut: enCours })

        // Then
        expect(action.statut).to.equal(enCours)
      })

      it("met à jour la date d'actualisation de l'action", async () => {
        // Given
        const date = uneDatetime.toJSDate()
        const action = uneAction({
          statut: Action.Statut.PAS_COMMENCEE
        })
        const enCours = Action.Statut.EN_COURS

        // When
        action.updateStatut({ statut: enCours, date })

        // Then
        expect(action.dateDerniereActualisation).to.equal(date)
      })

      it('ignore le paramètre estTerminee', async () => {
        // Given
        const action = uneAction({
          statut: Action.Statut.PAS_COMMENCEE
        })
        const enCours = Action.Statut.EN_COURS

        // When
        action.updateStatut({
          statut: enCours,
          estTerminee: true
        })

        // Then
        expect(action.statut).to.equal(enCours)
      })

      describe('Quand le nouveau statut est incorrect', () => {
        it('renvoie une failure Action.StatutIncorrect', async () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.TERMINEE
          })

          // When
          const result = action.updateStatut({
            statut: 'STATUT_INCORRECT' as Action.Statut
          })

          // Then
          expect(result).to.deep.equal(
            failure(new Action.StatutInvalide('STATUT_INCORRECT'))
          )
        })
      })
    })

    describe("Quand le nouveau statut n'est pas fourni", () => {
      describe('quand updateStatut.estTerminee est true', () => {
        it("termine l'action", async () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.PAS_COMMENCEE
          })

          // When
          action.updateStatut({ estTerminee: true })

          // Then
          expect(action.statut).to.equal(Action.Statut.TERMINEE)
        })
      })

      describe('quand updateStatut.estTerminee est false', () => {
        describe("quand l'action n'est pas terminée", () => {
          it('ne fait rien', async () => {
            // Given
            const action = uneAction({
              statut: Action.Statut.EN_COURS
            })

            // When
            action.updateStatut({ estTerminee: false })

            // Then
            expect(action.statut).to.equal(Action.Statut.EN_COURS)
          })
        })

        describe("quand l'action est terminée", () => {
          it("commence l'action", async () => {
            // Given
            const action = uneAction({
              statut: Action.Statut.TERMINEE
            })
            // When
            action.updateStatut({ estTerminee: false })

            // Then
            expect(action.statut).to.equal(Action.Statut.EN_COURS)
          })
        })
      })
    })

    describe("Quand aucun paramètre n'est fourni", () => {
      it('ne fait rien', async () => {
        // Given
        const action = uneAction({
          statut: Action.Statut.TERMINEE
        })
        // When
        action.updateStatut({})

        // Then
        expect(action.statut).to.equal(Action.Statut.TERMINEE)
      })
    })
  })
})

describe('Action.Factory', () => {
  describe('.buildAction', () => {
    let idService: StubbedClass<IdService>
    let dateService: StubbedClass<DateService>
    const now = new Date()
    const id = '26279b34-318a-45e4-a8ad-514a1090462c'
    let factory: Action.Factory
    beforeEach(async () => {
      // Given
      idService = stubClass(IdService)
      idService.uuid.returns(id)
      dateService = stubClass(DateService)
      dateService.nowJs.returns(now)
      factory = new Action.Factory(idService, dateService)
    })

    it('crée une action', async () => {
      // Given
      const action: Action = uneAction({
        id,
        dateCreation: now,
        dateDerniereActualisation: now,
        statut: Action.Statut.EN_COURS
      })
      const {
        contenu,
        idJeune,
        statut,
        commentaire,
        idCreateur,
        typeCreateur
      } = action

      // When
      const actual = factory.buildAction(
        { contenu, idJeune, statut, commentaire },
        { id: idCreateur, type: typeCreateur }
      )

      // Then
      expect(actual).to.deep.equal({ _isSuccess: true, data: action })
    })

    describe('Quand le statut est absent', () => {
      it('crée une action avec le statut Action.PAS_COMMENCEE par défaut', async () => {
        // Given
        const action: Action = uneAction({
          id,
          dateCreation: now,
          dateDerniereActualisation: now,
          statut: Action.Statut.PAS_COMMENCEE
        })
        const { contenu, idJeune, commentaire, idCreateur, typeCreateur } =
          action

        // When
        const actual = factory.buildAction(
          { contenu, idJeune, commentaire },
          { id: idCreateur, type: typeCreateur }
        )

        // Then
        expect(actual).to.deep.equal({ _isSuccess: true, data: action })
      })
    })

    describe('Quand le statut est incorrect', () => {
      it('renvoie une failure Action.StatutIncorrect', async () => {
        // Give
        const statutIncorrect = 'STATUT_INCORRECT' as Action.Statut

        // When
        const actual = factory.buildAction(
          { contenu: 'contenu', idJeune: 'idJeune', statut: statutIncorrect },
          { id: 'idCreateur', type: Action.TypeCreateur.CONSEILLER }
        )

        // Then
        expect(actual).to.deep.equal(
          failure(new Action.StatutInvalide(statutIncorrect))
        )
      })
    })
  })
})
