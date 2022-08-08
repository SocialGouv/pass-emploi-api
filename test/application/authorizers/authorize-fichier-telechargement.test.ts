import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Fichier } from 'src/domain/fichier'
import { Jeune } from 'src/domain/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { FichierTelechargementAuthorizer } from '../../../src/application/authorizers/authorize-fichier-telechargement'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import { createSandbox, expect } from '../../utils'

describe('FichierTelechargementAuthorizer', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let fichierTelechargementAuthorizer: FichierTelechargementAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    fichierTelechargementAuthorizer = new FichierTelechargementAuthorizer(
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
      const result = await fichierTelechargementAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
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
      const result = await fichierTelechargementAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
    it('autorise un jeune quand il est présent', async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [utilisateur.id] }))

      // When
      const result = await fichierTelechargementAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it("n'autorise pas le jeune quand il n'est pas présent", async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [] }))

      // When
      const result = await fichierTelechargementAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
    it("retourne Droits Insuffisants quand le fichier n'existe pas", async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(undefined)

      // When
      const result = await fichierTelechargementAuthorizer.authorize(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})
