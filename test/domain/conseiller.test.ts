import { MauvaiseCommandeError } from '../../src/building-blocks/types/domain-error'
import { Failure, isFailure } from '../../src/building-blocks/types/result'
import { Conseiller } from '../../src/domain/conseiller'
import { Core } from '../../src/domain/core'
import { unConseiller } from '../fixtures/conseiller.fixture'
import { expect } from '../utils'
import Structure = Core.Structure

describe('Conseiller', () => {
  describe('mettreAJour', () => {
    describe('conseiller Mission Locale', () => {
      it('n‘autorise pas la mise à jour d‘une agence hors référentiel', async () => {
        // Given
        const conseillerMilo = unConseiller({
          id: 'id-conseiller',
          structure: Structure.MILO
        })
        const agenceHorsReferentiel: Conseiller.InfosDeMiseAJour = {
          agence: {
            nom: 'une agence, hors référentiel, renseignée manuellement'
          }
        }
        // When
        const result = Conseiller.mettreAJour(
          conseillerMilo,
          agenceHorsReferentiel
        )

        // Then
        expect(isFailure(result)).to.equal(true)
        expect((result as Failure).error).to.be.an.instanceOf(
          MauvaiseCommandeError
        )
      })
    })
  })
})
