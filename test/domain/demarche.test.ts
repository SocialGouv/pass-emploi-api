import { DateTime } from 'luxon'
import { Demarche } from '../../src/domain/demarche'
import { DateService } from '../../src/utils/date-service'
import { uneDate, uneDatetime } from '../fixtures/date.fixture'
import { uneDemarche } from '../fixtures/demarche.fixture'
import { expect, StubbedClass, stubClass } from '../utils'

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
      it('génère une date de debut et de modification', () => {
        // Given
        const demarche = uneDemarche()

        // When
        const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
          demarche.id,
          Demarche.Statut.EN_COURS
        )

        // Then
        expect(demarcheModifiee).to.deep.equal({
          id: demarche.id,
          statut: Demarche.Statut.EN_COURS,
          dateModification: uneDatetime,
          dateDebut: uneDatetime
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
            demarche.dateDebut
          )

          // Then
          expect(demarcheModifiee).to.deep.equal({
            id: demarche.id,
            statut: Demarche.Statut.REALISEE,
            dateModification: uneDatetime,
            dateDebut: uneDatetime,
            dateFin: uneDatetime
          })
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
            demarche.dateDebut
          )

          // Then
          expect(demarcheModifiee).to.deep.equal({
            id: demarche.id,
            statut: Demarche.Statut.REALISEE,
            dateModification: uneDatetime,
            dateFin: uneDatetime
          })
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
            demarche.dateDebut
          )

          // Then
          expect(demarcheModifiee).to.deep.equal({
            id: demarche.id,
            statut: Demarche.Statut.REALISEE,
            dateModification: uneDatetime,
            dateFin: uneDatetime,
            dateDebut: uneDatetime
          })
        })
      })
    })
    describe('à faire', () => {
      it('met une date de début a null', () => {
        // Given
        const demarche = uneDemarche()
        // When
        const demarcheModifiee = demarcheFactory.mettreAJourLeStatut(
          demarche.id,
          Demarche.Statut.A_FAIRE,
          demarche.dateDebut
        )

        // Then
        expect(demarcheModifiee).to.deep.equal({
          id: demarche.id,
          statut: Demarche.Statut.A_FAIRE,
          dateModification: uneDatetime,
          dateDebut: null
        })
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
          demarche.dateDebut
        )

        // Then
        expect(demarcheModifiee).to.deep.equal({
          id: demarche.id,
          statut: Demarche.Statut.ANNULEE,
          dateModification: uneDatetime,
          dateAnnulation: uneDatetime
        })
      })
    })
  })
  describe('creerDemarchePerso', () => {
    it('génère une démarche perso', () => {
      // Given
      const description = 'test'
      const dateFin = uneDate()

      // When
      const demarche = demarcheFactory.creerDemarchePerso(description, dateFin)

      // Then
      expect(demarche).to.deep.equal({
        statut: Demarche.Statut.A_FAIRE,
        dateCreation: uneDatetime,
        dateDebut: DateTime.fromJSDate(dateFin),
        dateFin: DateTime.fromJSDate(dateFin),
        pourquoi: 'P01',
        quoi: 'Q38',
        description
      })
    })
  })
})
