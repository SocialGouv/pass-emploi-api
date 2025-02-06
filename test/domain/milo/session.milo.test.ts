import { SessionMilo } from 'src/domain/milo/session.milo'
import { DateTime } from 'luxon'
import { uneSessionMilo } from '../../fixtures/sessions.fixture'
import {
  Failure,
  failure,
  isFailure,
  isSuccess
} from 'src/building-blocks/types/result'
import {
  EmargementIncorrect,
  NombrePlacesInsuffisant
} from 'src/building-blocks/types/domain-error'
import { expect } from 'test/utils'

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

  describe('emarger', () => {
    const uneDateDEmargement = DateTime.local(2023)
    const uneSessionAvecUneInscription = {
      ...uneSessionMilo(),
      inscriptions: [
        {
          idJeune: 'id-hermione',
          idInscription: 'id-inscription-hermione',
          nom: 'Granger',
          prenom: 'Hermione',
          statut: SessionMilo.Inscription.Statut.INSCRIT
        }
      ]
    }

    it('renvoie une failure si tous les jeunes de la session ne sont pas emargés', () => {
      // When
      const result = SessionMilo.emarger(
        uneSessionMilo(),
        [
          {
            idJeune: 'id-hermione',
            statut: SessionMilo.Inscription.Statut.INSCRIT
          }
        ],
        uneDateDEmargement
      )
      // Then
      expect(result).to.deep.equal(failure(new EmargementIncorrect()))
    })

    it('renvoie un statut REFUS_JEUNE pour les jeunes inscrits mais non présents', async () => {
      assertInsriptionsAModifier(SessionMilo.Inscription.Statut.INSCRIT, [
        {
          idJeune: 'id-hermione',
          idInscription: 'id-inscription-hermione',
          statut: SessionMilo.Inscription.Statut.REFUS_JEUNE,
          commentaire: 'Absent'
        }
      ])
    })

    it('renvoie un statut PRESENT pour les jeunes présents', async () => {
      assertInsriptionsAModifier(SessionMilo.Inscription.Statut.PRESENT, [
        {
          idJeune: 'id-hermione',
          idInscription: 'id-inscription-hermione',
          statut: SessionMilo.Inscription.Statut.PRESENT,
          commentaire: undefined
        }
      ])
    })

    it('ne renvoie pas les jeunes au statut REFUS_JEUNE', async () => {
      assertInsriptionsAModifier(SessionMilo.Inscription.Statut.REFUS_JEUNE, [])
    })

    it('ne renvoie pas les jeunes au statut REFUS_TIERS', async () => {
      assertInsriptionsAModifier(SessionMilo.Inscription.Statut.REFUS_TIERS, [])
    })

    it('renvoie la session avec une date de clôture et la date de modification mise à jour', async () => {
      const result = await SessionMilo.emarger(
        uneSessionAvecUneInscription,
        [
          {
            idJeune: 'id-hermione',
            statut: SessionMilo.Inscription.Statut.PRESENT
          }
        ],
        uneDateDEmargement
      )
      // Then
      expect(isSuccess(result)).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.sessionEmargee).to.deep.equal({
          ...uneSessionAvecUneInscription,
          dateCloture: uneDateDEmargement,
          dateModification: uneDateDEmargement
        })
      }
    })

    function assertInsriptionsAModifier(
      givenStatut: SessionMilo.Inscription.Statut,
      expected: Array<Omit<SessionMilo.Inscription, 'nom' | 'prenom'>>
    ): void {
      // When
      const result = SessionMilo.emarger(
        uneSessionAvecUneInscription,
        [{ idJeune: 'id-hermione', statut: givenStatut }],
        uneDateDEmargement
      )

      // Then
      expect(isSuccess(result)).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.inscriptionsAModifier).to.deep.equal(expected)
      }
    }
  })

  describe('peutInscrireBeneficiaire', () => {
    it('réussi s’il n’y a pas de maximum de places', async () => {
      // When
      const result = SessionMilo.peutInscrireBeneficiaire({
        nbPlacesDisponibles: undefined
      })

      // Then
      expect(isSuccess(result)).to.be.true()
    })

    it('réussi s’il reste des places', async () => {
      // When
      const result = SessionMilo.peutInscrireBeneficiaire({
        nbPlacesDisponibles: 12
      })

      // Then
      expect(isSuccess(result)).to.be.true()
    })

    it('échoue s’il n’y a plus de place disponible', async () => {
      // When
      const result = SessionMilo.peutInscrireBeneficiaire({
        nbPlacesDisponibles: 0
      })

      // Then
      expect(isFailure(result)).to.be.true()
      expect((result as Failure).error).to.be.an.instanceOf(
        NombrePlacesInsuffisant
      )
    })
  })
})
