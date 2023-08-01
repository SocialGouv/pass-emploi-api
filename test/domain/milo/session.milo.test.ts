import { SessionMilo } from 'src/domain/milo/session.milo'
import { expect } from 'chai'
import { DateTime } from 'luxon'

describe('SessionMilo', () => {
  describe('calculerStatut', () => {
    const maintenant = DateTime.now()

    describe('quand la date de fin est ultérieure à maintenant', () => {
      it('retourne le statut A_VENIR', () => {
        // Given
        const dateFin = maintenant.plus({ days: 1 })
        const dateCloture = undefined

        // When
        const statut = SessionMilo.calculerStatut(
          maintenant,
          dateFin,
          dateCloture
        )

        // Then
        expect(statut).to.equal(SessionMilo.Statut.A_VENIR)
      })
    })

    describe('quand la date de fin est antérieure à maintenant', () => {
      const dateFin = maintenant.minus({ days: 1 })

      it('et que la date de clôture est absente, retourne  le statut A_CLOTURER', () => {
        // Given
        const dateCloture = undefined

        // When
        const statut = SessionMilo.calculerStatut(
          maintenant,
          dateFin,
          dateCloture
        )

        // Then
        expect(statut).to.equal(SessionMilo.Statut.A_CLOTURER)
      })

      it('et que la date de clôture est présente, retourne  le statut CLOTUREE', () => {
        // Given
        const dateCloture = maintenant.minus({ hours: 1 })

        // When
        const statut = SessionMilo.calculerStatut(
          maintenant,
          dateFin,
          dateCloture
        )

        // Then
        expect(statut).to.equal(SessionMilo.Statut.CLOTUREE)
      })
    })
  })
})
