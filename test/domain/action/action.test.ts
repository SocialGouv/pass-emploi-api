import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
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
import { uneAutreDate, uneDate, uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('Action', () => {
  describe('Factory', () => {
    let actionFactory: Action.Factory
    let idService: StubbedClass<IdService>
    let dateService: StubbedClass<DateService>
    const id = '26279b34-318a-45e4-a8ad-514a1090462c'
    const now = uneDatetime()

    beforeEach(() => {
      idService = stubClass(IdService)
      idService.uuid.returns(id)
      dateService = stubClass(DateService)
      dateService.now.returns(now)
      actionFactory = new Action.Factory(idService, dateService)
    })

    describe('updateAction', () => {
      describe('Quand on peut modifier l’action', () => {
        it('met à jour les attributs', () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.EN_COURS
          })

          const nouvelleDate = DateTime.fromISO('2024-01-01')
          const nouveauCodeQualification = Action.Qualification.Code.CITOYENNETE

          const infosActionAMettreAJour = {
            idAction: 'id-action',
            statut: Action.Statut.TERMINEE,
            description: 'une nouvelle description',
            contenu: 'un nouveau contenu',
            dateEcheance: nouvelleDate,
            codeQualification: nouveauCodeQualification
          }

          // When
          const resultAction = actionFactory.updateAction(
            action,
            infosActionAMettreAJour
          )

          // Then
          expect(isSuccess(resultAction)).to.equal(true)
          if (isSuccess(resultAction)) {
            expect(resultAction.data.statut).to.equal(Action.Statut.TERMINEE)
            expect(resultAction.data.description).to.equal(
              'une nouvelle description'
            )
            expect(resultAction.data.contenu).to.equal('un nouveau contenu')
            expect(resultAction.data.dateEcheance).to.equal(nouvelleDate)
            expect(resultAction.data.qualification?.code).to.equal(
              nouveauCodeQualification
            )
          }
        })

        it('conserve les attributs non modifiés', () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.EN_COURS,
            dateDerniereActualisation: DateTime.fromISO('2023-04-12'),
            qualification: {
              code: Action.Qualification.Code.CULTURE_SPORT_LOISIRS
            }
          })

          // When
          const resultAction = actionFactory.updateAction(action, {
            idAction: 'id-action'
          })

          // Then
          expect(isSuccess(resultAction)).to.equal(true)
          if (isSuccess(resultAction)) {
            expect(resultAction.data).to.deep.equal({
              ...action,
              dateDerniereActualisation: now
            })
          }
        })

        describe('quand le statut passe en Terminée', () => {
          it('met à jour la dateDeFinReelle', () => {
            // Given
            const action = uneAction({
              statut: Action.Statut.EN_COURS
            })

            const infosActionAMettreAJour = {
              idAction: 'id-action',
              statut: Action.Statut.TERMINEE
            }

            // When
            const resultAction = actionFactory.updateAction(
              action,
              infosActionAMettreAJour
            )

            // Then
            expect(isSuccess(resultAction)).to.equal(true)
            if (isSuccess(resultAction)) {
              expect(resultAction.data.statut).to.equal(Action.Statut.TERMINEE)
              expect(resultAction.data.dateFinReelle).to.deep.equal(
                resultAction.data.dateEcheance
              )
            }
          })
        })

        it('met à jour la dateActualisation', () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.EN_COURS
          })

          const infosActionAMettreAJour = {
            idAction: 'id-action',
            description: 'nouvelle description'
          }

          // When
          const resultAction = actionFactory.updateAction(
            action,
            infosActionAMettreAJour
          )

          // Then
          expect(isSuccess(resultAction)).to.equal(true)
          if (isSuccess(resultAction)) {
            expect(resultAction.data.dateDerniereActualisation).to.deep.equal(
              now
            )
          }
        })
      })

      describe('Quand le statut de l’action est Qualifiée', () => {
        it('rejette', () => {
          // Given
          const action = uneAction({
            statut: Action.Statut.TERMINEE,
            qualification: {
              code: Action.Qualification.Code.EMPLOI,
              heures: 3,
              commentaire: 'Un commentaire'
            }
          })

          const infosActionAMettreAJour = {
            idAction: 'id-action',
            statut: Action.Statut.EN_COURS
          }

          // When
          const result = actionFactory.updateAction(
            action,
            infosActionAMettreAJour
          )

          // Then
          expect(result).to.deep.equal(
            failure(
              new MauvaiseCommandeError(
                'Vous ne pouvez pas modifier une action qualifée'
              )
            )
          )
        })
      })
    })

    describe('buildAction', () => {
      const dateEcheance = DateTime.fromISO('2020-02-02T00:00:00.000')
      const dateEcheanceA9h30 = DateTime.fromISO('2020-02-02T09:30:00.000')

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
              dateCreation: now,
              dateDerniereActualisation: now,
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
              dateCreation: now,
              dateDerniereActualisation: now,
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
              dateCreation: now,
              dateDerniereActualisation: now,
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
              dateCreation: now,
              dateDerniereActualisation: now,
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
              dateCreation: now,
              dateDerniereActualisation: now,
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
            dateCreation: now,
            dateDerniereActualisation: now,
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
            dateEcheance: uneDatetime().plus({ day: 4 })
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
            dateEcheance: uneDatetime().plus({ day: 4 })
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
            dateEcheance: uneDatetime().plus({ day: 4 })
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
            dateEcheance: uneDatetime().plus({ day: 4 })
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
            dateEcheance: uneDatetime().plus({ day: 2 })
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
            dateEcheance: uneDatetime().plus({ day: 3 })
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
            dateEcheance: uneDatetime().plus({ day: 3 })
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
            dateEcheance: uneDatetime().plus({ day: 3 })
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
            dateEcheance: uneDatetime().plus({ day: 4 })
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
            dateEcheance: uneDatetime().plus({ day: 2 })
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
    const dateFinReelle = DateTime.fromJSDate(uneDate())

    it("renvoie l'action qualifiée NON_SNP", () => {
      // Given
      const actionTerminee: Action = uneAction({
        dateFinReelle,
        statut: Action.Statut.TERMINEE
      })

      // When
      const actionQualifiee = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.NON_SNP,
        'Un commentaire'
      )

      const expectedAction: Action.Qualifiee = {
        ...actionTerminee,
        dateDebut: actionTerminee.dateEcheance,
        dateFinReelle,
        qualification: {
          code: Action.Qualification.Code.NON_SNP,
          heures: 0,
          commentaire: undefined
        }
      }

      // Then
      expect(actionQualifiee).to.deep.equal(success(expectedAction))
    })

    it("renvoie l'action qualifiée SANTE", () => {
      // Given
      const nouvelleDateFinReelle = DateTime.fromJSDate(uneAutreDate())
      const actionTerminee: Action = uneAction({
        dateFinReelle,
        statut: Action.Statut.TERMINEE
      })
      // When
      const actionQualifiee = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        'Un commentaire',
        undefined,
        nouvelleDateFinReelle
      )

      // Then
      const expectedAction: Action.Qualifiee = {
        ...actionTerminee,
        qualification: {
          code: Action.Qualification.Code.SANTE,
          heures: 2,
          commentaire: 'Un commentaire'
        },
        dateDebut: actionTerminee.dateEcheance,
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
          heures: 2,
          commentaire: 'Un commentaire'
        }
      })
      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        'Un commentaire'
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
        Action.Qualification.Code.SANTE,
        'Un commentaire'
      )

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError("L'action n'est pas terminée"))
      )
    })

    it('rejette quand la date de fin réelle est antécédente à la date de création', () => {
      // Given
      const actionTerminee: Action = uneActionTerminee({
        dateCreation: DateTime.fromISO('2022-08-01')
      })
      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        'Un commentaire',
        DateTime.fromISO('2022-07-01')
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
        dateCreation: DateTime.fromISO('2022-08-01T10:00:00.000Z')
      })
      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        'Un commentaire',
        undefined,
        DateTime.fromISO('2022-08-01T05:00:00.000+02:00')
      )

      // Then
      expect(isSuccess(result)).to.be.true()
    })

    it('met une valeur par défaut quand aucun commentaire n’est renseigné pour une SNP', () => {
      // Given
      const actionTerminee: Action = uneActionTerminee()

      // When
      const result = Action.qualifier(
        actionTerminee,
        Action.Qualification.Code.SANTE,
        undefined,
        undefined,
        dateFinReelle
      )

      // Then
      const expectedAction: Action.Qualifiee = {
        ...actionTerminee,
        dateDebut: actionTerminee.dateEcheance,
        dateFinReelle,
        qualification: {
          code: Action.Qualification.Code.SANTE,
          heures: 2,
          commentaire: "Contenu de l'action - Commentaire de l'action"
        }
      }
      expect(result).to.be.deep.equal(success(expectedAction))
    })
  })
})
