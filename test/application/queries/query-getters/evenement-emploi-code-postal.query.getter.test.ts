import { EvenementEmploiCodePostalQueryGetter } from 'src/application/queries/query-getters/evenement-emploi-code-postal.query.getter'
import { expect } from 'test/utils'

describe('EvenementEmploiCodePostalQueryGetter', () => {
  const mapper = new EvenementEmploiCodePostalQueryGetter()

  it("pour le code postal d'une ville qui n'a qu'un seul code postal retourne un tableau avec uniquement ce code postal", () => {
    // Given
    const codePostalVilleAvecUnSeulCodePostal = '94240'

    // When
    const codePostauxAssocies = mapper.getCodePostauxAssocies(
      codePostalVilleAvecUnSeulCodePostal
    )

    // Then
    expect(codePostauxAssocies).to.deep.equal([
      codePostalVilleAvecUnSeulCodePostal
    ])
  })

  it("pour le code postal d'une ville qui a plusieurs codes postaux retourne un tableau avec tous les codes postaux de la ville", () => {
    // Given
    const codePostalVilleAvecPlusieursCodesPostaux = '20090'

    // When
    const codePostauxAssocies = mapper.getCodePostauxAssocies(
      codePostalVilleAvecPlusieursCodesPostaux
    )

    // Then
    expect(codePostauxAssocies).to.deep.equal(['20000', '20090'])
  })
})
