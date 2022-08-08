import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Fichier } from '../../../src/domain/fichier'
import { FichierSuppressionAuthorizer } from '../../../src/application/authorizers/authorize-fichier-suppression'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'

describe('FichierSuppressionAuthorizer', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let fichierSuppressionAuthorizer: FichierSuppressionAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    fichierSuppressionAuthorizer = new FichierSuppressionAuthorizer(
      fichierRepository
    )
  })
  describe('authorize', () => {
    const idFichier = 'test'
    it('autorise le créateur du fichier à le supprimer', async () => {
      //Given
      const idConseiller = '1'
      const utilisateur = unUtilisateurConseiller({ id: idConseiller })
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idCreateur: idConseiller }))

      // When
      const result = await fichierSuppressionAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it("retourne Droits Insuffisants quand le fichier n'existe pas", async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(undefined)

      // When
      const result = await fichierSuppressionAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})
