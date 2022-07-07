import { DateObjectUnits, DateTime } from 'luxon'
import { Demarche } from '../../src/domain/demarche'
import { DateService } from '../../src/utils/date-service'
import { uneDate, uneDatetime } from '../fixtures/date.fixture'
import { uneDemarche } from '../fixtures/demarche.fixture'
import { expect, StubbedClass, stubClass } from '../utils'
import { failure, success } from '../../src/building-blocks/types/result'
import { MauvaiseCommandeError } from '../../src/building-blocks/types/domain-error'

const parametreHeureAMidi: DateObjectUnits = {
  hour: 12,
  minute: 0,
  second: 0,
  millisecond: 0
}

describe('Demarche', () => {
  let demarcheFactory: Demarche.Factory
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime)
    demarcheFactory = new Demarche.Factory(dateService)
  })

  describe('mettreAJourLeStatut', () => {
    describe('en cours', () => {
      describe('quand la date de fin est dans le futur', () => {
        it('génère une date de debut et de modification', () => {
          // Given
          const demarche = uneDemarche()

          // When
          const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
            demarche.id,
            Demarche.Statut.EN_COURS,
            uneDatetime.plus({ day: 5 }).toUTC().toJSDate()
          )

          // Then
          expect(demarcheModifiee).to.deep.equal(
            success({
              id: demarche.id,
              statut: Demarche.Statut.EN_COURS,
              dateModification: uneDatetime,
              dateDebut: uneDatetime,
              dateFin: uneDatetime.plus({ day: 5 }).toUTC()
            })
          )
        })
      })

      describe('quand la date de fin est dans le passé', () => {
        it('renvoie une failure', () => {
          // Given
          const demarche = uneDemarche()

          // When
          const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
            demarche.id,
            Demarche.Statut.EN_COURS,
            uneDatetime.minus({ day: 5 }).toJSDate()
          )

          // Then
          expect(demarcheModifiee).to.deep.equal(
            failure(
              new MauvaiseCommandeError(
                'Une démarche en cours ne peut pas avoir une date de fin dans le passé'
              )
            )
          )
        })
      })
    })
    describe('réalisé', () => {
      describe('quand la date de debut est dans le futur', () => {
        it('génère une date de debut et de modification', () => {
          // Given
          const demarche = uneDemarche({
            dateDebut: uneDatetime.plus({ day: 5 }).toJSDate()
          })
          // When
          const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
            demarche.id,
            Demarche.Statut.REALISEE,
            demarche.dateFin,
            demarche.dateDebut
          )

          // Then
          expect(demarcheModifiee).to.deep.equal(
            success({
              id: demarche.id,
              statut: Demarche.Statut.REALISEE,
              dateModification: uneDatetime,
              dateDebut: uneDatetime,
              dateFin: uneDatetime
            })
          )
        })
      })
      describe('quand la date de debut est dans le passé', () => {
        it('génère une date de modification', () => {
          // Given
          const dateDebutDansLePasse = uneDatetime.minus({ day: 5 }).toJSDate()
          const demarche = uneDemarche({
            dateDebut: dateDebutDansLePasse
          })
          // When
          const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
            demarche.id,
            Demarche.Statut.REALISEE,
            demarche.dateFin,
            demarche.dateDebut
          )

          // Then
          expect(demarcheModifiee).to.deep.equal(
            success({
              id: demarche.id,
              statut: Demarche.Statut.REALISEE,
              dateModification: uneDatetime,
              dateFin: uneDatetime
            })
          )
        })
      })
      describe("quand il n'y a pas de date de début", () => {
        it('génère une date de début et de modification', () => {
          // Given
          const demarche = uneDemarche({
            dateDebut: undefined
          })
          // When
          const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
            demarche.id,
            Demarche.Statut.REALISEE,
            demarche.dateFin,
            demarche.dateDebut
          )

          // Then
          expect(demarcheModifiee).to.deep.equal(
            success({
              id: demarche.id,
              statut: Demarche.Statut.REALISEE,
              dateModification: uneDatetime,
              dateFin: uneDatetime,
              dateDebut: uneDatetime
            })
          )
        })
      })
    })
    describe('à faire', () => {
      it('met une date de début a undefined', () => {
        // Given
        const demarche = uneDemarche()
        // When
        const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
          demarche.id,
          Demarche.Statut.A_FAIRE,
          demarche.dateFin,
          demarche.dateDebut
        )

        // Then
        expect(demarcheModifiee).to.deep.equal(
          success({
            id: demarche.id,
            statut: Demarche.Statut.A_FAIRE,
            dateModification: uneDatetime,
            dateDebut: undefined,
            dateFin: DateTime.fromJSDate(demarche.dateFin).toUTC()
          })
        )
      })
    })
    describe('annulé', () => {
      it("met une date d'annulation", () => {
        // Given
        const demarche = uneDemarche()
        // When
        const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
          demarche.id,
          Demarche.Statut.ANNULEE,
          demarche.dateFin,
          demarche.dateDebut
        )

        // Then
        expect(demarcheModifiee).to.deep.equal(
          success({
            id: demarche.id,
            statut: Demarche.Statut.ANNULEE,
            dateModification: uneDatetime,
            dateAnnulation: uneDatetime,
            dateFin: undefined,
            dateDebut: undefined
          })
        )
      })
    })
  })
  describe('creerDemarche', () => {
    context("quand c'est une démarche personnalisée", () => {
      it('génère une démarche perso', () => {
        // Given
        const description = 'test'
        const dateFin = uneDate()
        const demarcheACreer: Demarche.ACreer = {
          description,
          dateFin
        }

        // When
        const demarche = demarcheFactory.creerDemarche(demarcheACreer)

        // Then
        const demarcheCree: Demarche.Creee = {
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: uneDatetime,
          dateFin: DateTime.fromJSDate(dateFin).set(parametreHeureAMidi),
          pourquoi: 'P01',
          quoi: 'Q38',
          description
        }
        expect(demarche).to.deep.equal(success(demarcheCree))
      })
    })
    context("quand c'est une démarche du référentiel PE", () => {
      describe('quand les champs sont invalides', () => {
        it('rejette', () => {
          // Given
          const dateFin = uneDate()
          const demarcheACreer: Demarche.ACreer = {
            dateFin,
            quoi: 'C21',
            comment: 'B12'
          }

          // When
          const demarche = demarcheFactory.creerDemarche(demarcheACreer)

          // Then
          const erreur = new MauvaiseCommandeError(
            'Pour créer une démarche du référentiel il faut un quoi et un pourquoi à minima, ou une description'
          )
          expect(demarche).to.deep.equal(failure(erreur))
        })
      })
      describe('quand les champs sont valides', () => {
        it('génère une démarche', () => {
          // Given
          const dateFin = uneDate()
          const demarcheACreer: Demarche.ACreer = {
            dateFin,
            quoi: 'C21',
            pourquoi: 'A42',
            comment: 'B12'
          }

          // When
          const demarche = demarcheFactory.creerDemarche(demarcheACreer)

          // Then
          const demarcheCree: Demarche.Creee = {
            statut: Demarche.Statut.A_FAIRE,
            dateCreation: uneDatetime,
            dateFin: DateTime.fromJSDate(dateFin).set(parametreHeureAMidi),
            quoi: 'C21',
            pourquoi: 'A42',
            comment: 'B12'
          }
          expect(demarche).to.deep.equal(success(demarcheCree))
        })
      })
    })
  })
})
