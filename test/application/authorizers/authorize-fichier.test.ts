import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Fichier } from 'src/domain/fichier'
import { FichierAuthorizer } from '../../../src/application/authorizers/authorize-fichier'
import { Unauthorized } from '../../../src/domain/erreur'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'
import { Jeune } from 'src/domain/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'

describe('FichierAuthorizer', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let fichierAuthorizer: FichierAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    fichierAuthorizer = new FichierAuthorizer(
      fichierRepository,
      jeuneRepository
    )
  })

  describe('authorize', () => {
    const idFichier = 'test'
    it('autorise un conseiller quand un de ses jeunes est présent', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      const idJeuneDuConseiller = '1'
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [idJeuneDuConseiller] }))
      jeuneRepository.findAllJeunesByConseiller
        .withArgs([idJeuneDuConseiller], utilisateur.id)
        .resolves([unJeune()])

      // When
      const call = await fichierAuthorizer.authorize(idFichier, utilisateur)

      // Then
      expect(call).to.be.equal(undefined)
    })
    it("n'autorise pas le conseiller quand aucun de ses jeunes n'est présent", async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      const idJeuneDuConseiller = '1'
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [idJeuneDuConseiller] }))
      jeuneRepository.findAllJeunesByConseiller
        .withArgs([idJeuneDuConseiller], utilisateur.id)
        .resolves([])

      // When
      const call = fichierAuthorizer.authorize(idFichier, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
    })
    it('autorise un jeune quand il est présent', async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [utilisateur.id] }))

      // When
      const call = await fichierAuthorizer.authorize(idFichier, utilisateur)

      // Then
      expect(call).to.be.equal(undefined)
    })
    it("n'autorise pas le jeune quand il n'est pas présent", async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [] }))

      // When
      const call = fichierAuthorizer.authorize(idFichier, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
    })
    it("n'autorise pas quand le fichier n'existe pas", async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(undefined)

      // When
      const call = fichierAuthorizer.authorize(idFichier, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
    })
  })
})
