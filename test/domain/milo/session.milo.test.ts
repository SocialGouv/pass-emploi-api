import { SessionMilo } from 'src/domain/milo/session.milo'
import { expect } from 'chai'
import { DateTime } from 'luxon'

describe('SessionMilo', () => {
  describe('calculerStatut', () => {
    const maintenant = DateTime.now()

    describe('quand la date de clôture est renseignée', () => {
      it('retourne le statut CLOTUREE même si la date de fin est postérieure à maintenant', () => {
        // Given
        const dateFin = maintenant.plus({ days: 1 })
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

    describe('quand la date de clôture n’est pas renseignée', () => {
      const dateCloture = undefined

      it('si la date de fin est ultérieure à maintenant, retourne  le statut A_VENIR', () => {
        // Given
        const dateFin = maintenant.plus({ days: 1 })

        // When
        const statut = SessionMilo.calculerStatut(
          maintenant,
          dateFin,
          dateCloture
        )

        // Then
        expect(statut).to.equal(SessionMilo.Statut.A_VENIR)
      })

      it('si la date de fin est antérieure à maintenant, retourne  le statut A_CLOTURER', () => {
        // Given
        const dateFin = maintenant.minus({ days: 1 })

        // When
        const statut = SessionMilo.calculerStatut(
          maintenant,
          dateFin,
          dateCloture
        )

        // Then
        expect(statut).to.equal(SessionMilo.Statut.A_CLOTURER)
      })
    })
  })
})
