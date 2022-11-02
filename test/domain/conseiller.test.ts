import { unConseiller } from '../fixtures/conseiller.fixture'
import { Conseiller } from '../../src/domain/conseiller'
import { Core } from '../../src/domain/core'
import Structure = Core.Structure
import { expect } from '../utils'
import { Failure, isFailure } from '../../src/building-blocks/types/result'
import { DroitsInsuffisants } from '../../src/building-blocks/types/domain-error'

describe('Conseiller.Factory', () => {
  let conseillerFactory: Conseiller.Factory

  beforeEach(() => {
    conseillerFactory = new Conseiller.Factory()
  })

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
        const result = conseillerFactory.mettreAJour(
          conseillerMilo,
          agenceHorsReferentiel
        )

        // Then
        expect(isFailure(result)).to.equal(true)
        expect((result as Failure).error).to.be.an.instanceOf(
          DroitsInsuffisants
        )
      })
    })
  })
})
