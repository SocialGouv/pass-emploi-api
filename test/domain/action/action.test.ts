import { uneAutreDate, uneDate, uneDatetime } from 'test/fixtures/date.fixture'
import {
  failure,
  isFailure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action/action'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { uneAction, uneActionTerminee } from '../../fixtures/action.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unJeune } from '../../fixtures/jeune.fixture'
import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'

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
            expect(resultAction.data.dateFinReelle).to.be.undefined()
          }
        })
      })

      describe("quand l'action passe en terminée", () => {
        it('met à jour la date de fin', () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.EN_COURS
          })

          // When
          const resultAction = actionFactory.updateStatut(
            action,
            Action.Statut.TERMINEE
          )

          // Then
          expect(isSuccess(resultAction)).to.equal(true)
          if (isSuccess(resultAction)) {
            expect(resultAction.data.statut).to.equal(Action.Statut.TERMINEE)
            expect(resultAction.data.dateFinReelle).to.deep.equal(nowJs)
          }
        })
      })

      describe("quand l'action est qualifiée", () => {
        it('rejette', () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.TERMINEE,
            qualification: {
              code: Action.Qualification.Code.EMPLOI,
              heures: 3
            }
          })

          // When
          const result = actionFactory.updateStatut(
            action,
            Action.Statut.EN_COURS
          )

          // Then
          expect(result).to.deep.equal(
            failure(
              new MauvaiseCommandeError(
                "Vous ne pouvez pas changer le statut d'une action qualifée"
              )
            )
          )
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
              dateFinReelle: undefined,
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
            expect(actual._isSuccess && actual.data).to.deep.equal({
              ...expectedAction
            })
          })
        })
        describe('quand le jeune est le créateur', () => {
          it('crée une action avec le statut fourni', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'
            const statut = Action.Statut.PAS_COMMENCEE
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
            expect(isSuccess(actual) && actual.data).to.deep.equal(action)
          })
          it('crée une action avec rappel fournis', async () => {
            // Given
            const contenu = 'test'
            const idJeune = '1'
            const commentaire = 'test'
            const statut = Action.Statut.EN_COURS
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
            expect(isSuccess(actual) && actual.data).to.deep.equal(action)
          })
        })
        describe("quand l'action est créé Terminée", () => {
          it('crée une action avec une date de fin réelle', async () => {
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
              dateFinReelle: dateEcheanceA9h30,
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
            expect(isSuccess(actual) && actual.data).to.deep.equal(action)
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
              dateFinReelle: dateEcheanceA9h30,
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
            expect(isSuccess(actual) && actual.data).to.deep.equal(action)
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
  describe('qualifier', () => {
    const dateFinReelle = uneDate()

    it("renvoie l'action qualifiée NON_SNP", () => {
      // Given
      const actionTerminee: Action = uneAction({
        dateFinReelle,
        statut: Action.Statut.TERMINEE
      })

      // When
      const actionQualifiee = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.NON_SNP
      )

      const expectedAction: Action = {
        ...actionTerminee,
        qualification: { code: Action.Qualification.Code.NON_SNP, heures: 0 }
      }

      // Then
      expect(actionQualifiee).to.deep.equal(success(expectedAction))
    })
    it("renvoie l'action qualifiée SANTE", () => {
      // Given
      const nouvelleDateFinReelle = uneAutreDate()
      const actionTerminee: Action = uneAction({
        dateFinReelle,
        statut: Action.Statut.TERMINEE
      })
      // When
      const actionQualifiee = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        nouvelleDateFinReelle
      )

      // Then
      const expectedAction: Action = {
        ...actionTerminee,
        qualification: { code: Action.Qualification.Code.SANTE, heures: 2 },
        dateFinReelle: nouvelleDateFinReelle
      }
      expect(actionQualifiee).to.deep.equal(success(expectedAction))
    })
    it("rejette quand l'action est déjà qualifiée", () => {
      // Given
      const actionTerminee: Action = uneAction({
        dateFinReelle,
        statut: Action.Statut.TERMINEE,
        qualification: {
          code: Action.Qualification.Code.EMPLOI,
          heures: 2
        }
      })
      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE
      )

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Action déjà qualifiée'))
      )
    })
    it("rejette quand l'action n'est pas terminée", () => {
      // Given
      const actionEnCours: Action = uneAction({
        statut: Action.Statut.EN_COURS
      })
      // When
      const result = Action.qualifier(
        actionEnCours,
        Action.Qualification.Code.SANTE
      )

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError("L'action n'est pas terminée"))
      )
    })
    it('rejette quand la date de fin réelle est antécédente à la date de création', () => {
      // Given
      const actionTerminee: Action = uneActionTerminee({
        dateCreation: new Date('2022-08-01')
      })
      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        new Date('2022-07-01')
      )

      // Then
      expect(result).to.deep.equal(
        failure(
          new MauvaiseCommandeError(
            'La date de fin doit être postérieure à la date de création'
          )
        )
      )
    })
    it('accepte quand la date de fin réelle est le même jour que la date de création', () => {
      // Given
      const actionTerminee: Action = uneActionTerminee({
        dateCreation: new Date('2022-08-01T10:00:00.000Z')
      })
      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        new Date('2022-08-01T05:00:00.000+02:00')
      )

      // Then
      expect(isSuccess(result)).to.be.true()
    })
  })
})
