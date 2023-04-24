import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Fichier } from 'src/domain/fichier'
import { Jeune } from 'src/domain/jeune/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { FichierAuthorizer } from '../../../src/application/authorizers/fichier-authorizer'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import { createSandbox, expect } from '../../utils'

describe('FichierTelechargementAuthorizer', () => {
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

  describe('autoriserTelechargementDuFichier', () => {
    const idFichier = 'test'
    it('autorise un conseiller quand un de ses jeunes est présent', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      const idJeuneDuConseiller = '1'
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [idJeuneDuConseiller] }))
      jeuneRepository.findAllJeunesByIdsAndConseiller
        .withArgs([idJeuneDuConseiller], utilisateur.id)
        .resolves([unJeune()])

      // When
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('autorise un conseiller quand il est le créateur', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      fichierRepository.getFichierMetadata.withArgs(idFichier).resolves(
        unFichierMetadata({
          idsJeunes: ['autre-id'],
          idCreateur: utilisateur.id
        })
      )
      jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([])

      // When
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
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
      fichierRepository.getFichierMetadata.withArgs(idFichier).resolves(
        unFichierMetadata({
          idsJeunes: [idJeuneDuConseiller],
          idCreateur: 'un-autre-createur'
        })
      )
      jeuneRepository.findAllJeunesByIdsAndConseiller
        .withArgs([idJeuneDuConseiller], utilisateur.id)
        .resolves([])

      // When
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
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
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
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
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
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
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('autoriserSuppressionDuFichier', () => {
    const idFichier = 'test'
    it('autorise le créateur du fichier à le supprimer', async () => {
      //Given
      const idConseiller = '1'
      const utilisateur = unUtilisateurConseiller({ id: idConseiller })
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idCreateur: idConseiller }))

      // When
      const result = await fichierAuthorizer.autoriserSuppressionDuFichier(
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
      const result = await fichierAuthorizer.autoriserSuppressionDuFichier(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})
