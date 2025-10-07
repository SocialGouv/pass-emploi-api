import { DateObjectUnits } from 'luxon'
import { MauvaiseCommandeError } from '../../src/building-blocks/types/domain-error'
import { failure, success } from '../../src/building-blocks/types/result'
import { Demarche } from '../../src/domain/demarche'
import { DateService } from '../../src/utils/date-service'
import { uneDatetime, uneDatetimeLocale } from '../fixtures/date.fixture'
import { uneDemarche } from '../fixtures/demarche.fixture'
import { expect, StubbedClass, stubClass } from '../utils'

const parametreHeureAMidi: DateObjectUnits = {
  hour: 12,
  minute: 0,
  second: 0,
  millisecond: 0
}

const uneDateAMidi = uneDatetimeLocale().toLocal()

describe('Demarche', () => {
  let demarcheFactory: Demarche.Factory
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
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
            uneDatetime().plus({ day: 5 })
          )

          // Then
          expect(demarcheModifiee).to.deep.equal(
            success({
              id: demarche.id,
              statut: Demarche.Statut.EN_COURS,
              dateModification: uneDatetime(),
              dateDebut: uneDateAMidi,
              dateFin: uneDatetime().plus({ day: 5 })
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
            uneDatetime().minus({ day: 5 })
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
    describe('réalisée', () => {
      describe('quand la date de debut est dans le futur', () => {
        it('génère une date de debut et de modification', () => {
          // Given
          const demarche = uneDemarche({
            dateFin: uneDatetime(),
            dateDebut: uneDatetime().plus({ day: 5 })
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
              dateModification: uneDatetime(),
              dateDebut: demarche.dateFin.set({
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0
              }),
              dateFin: demarche.dateFin.set({
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0
              })
            })
          )
        })
      })
      describe('quand la date de debut est dans le passé', () => {
        it('génère une date de modification + garde date debut', () => {
          // Given
          const dateDebutDansLePasse = uneDatetime().minus({ day: 5 })

          const demarche = uneDemarche({
            dateFin: uneDatetime(),
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
              dateModification: uneDatetime(),
              dateFin: demarche.dateFin.set({
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0
              }),
              dateDebut: dateDebutDansLePasse.set({
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0
              })
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
              dateModification: uneDatetime(),
              dateFin: demarche.dateFin.set({
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0
              }),
              dateDebut: demarche.dateFin.set({
                hour: 12,
                minute: 0,
                second: 0,
                millisecond: 0
              })
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
            dateModification: uneDatetime(),
            dateDebut: undefined,
            dateFin: demarche.dateFin
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
            dateModification: uneDatetime(),
            dateAnnulation: uneDatetime(),
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
        const dateFin = uneDatetime()
        const demarcheACreer: Demarche.ACreer = {
          description,
          dateFin
        }

        // When
        const demarche = demarcheFactory.creerDemarche(demarcheACreer)

        // Then
        const demarcheCree: Demarche.Creee = {
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: uneDateAMidi,
          dateFin: dateFin.set(parametreHeureAMidi),
          pourquoi: 'P01',
          quoi: 'Q38',
          description,
          promptIa: undefined
        }
        expect(demarche).to.deep.equal(success(demarcheCree))
      })
    })
    context("quand c'est une démarche du référentiel PE", () => {
      describe('quand les champs sont invalides', () => {
        it('rejette', () => {
          // Given
          const dateFin = uneDatetime()
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
          const dateFin = uneDatetime()
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
            dateCreation: uneDateAMidi,
            dateFin: dateFin.set(parametreHeureAMidi),
            quoi: 'C21',
            pourquoi: 'A42',
            comment: undefined,
            promptIa: undefined
          }
          expect(demarche).to.deep.equal(success(demarcheCree))
        })
        it('génère une démarche Réalisée', () => {
          // Given
          const dateFin = uneDatetime().minus({ days: 2 })
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
            statut: Demarche.Statut.REALISEE,
            dateCreation: uneDateAMidi,
            dateFin: dateFin.set(parametreHeureAMidi),
            quoi: 'C21',
            pourquoi: 'A42',
            comment: undefined,
            promptIa: undefined
          }
          expect(demarche).to.deep.equal(success(demarcheCree))
        })
      })
    })
  })
})
