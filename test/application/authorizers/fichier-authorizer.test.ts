import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { ListeDeDiffusionAuthorizer } from 'src/application/authorizers/liste-de-diffusion-authorizer'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Fichier } from 'src/domain/fichier'
import { Jeune } from 'src/domain/jeune/jeune'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { FichierAuthorizer } from '../../../src/application/authorizers/fichier-authorizer'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('FichierTelechargementAuthorizer', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let fichierAuthorizer: FichierAuthorizer
  let authorizeConseillerForJeunes: StubbedClass<ConseillerAuthorizer>
  let authorizeListeDeDiffusion: StubbedClass<ListeDeDiffusionAuthorizer>

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    authorizeConseillerForJeunes = stubClass(ConseillerAuthorizer)
    authorizeListeDeDiffusion = stubClass(ListeDeDiffusionAuthorizer)

    fichierAuthorizer = new FichierAuthorizer(
      fichierRepository,
      jeuneRepository,
      authorizeConseillerForJeunes,
      authorizeListeDeDiffusion
    )
  })

  describe('autoriserTelechargementDuFichier', () => {
    const idFichier = 'test'
    it('autorise un conseiller quand il est le créateur', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      fichierRepository.getFichierMetadata.withArgs(idFichier).resolves(
        unFichierMetadata({
          idsJeunes: ['autre-id'],
          idCreateur: utilisateur.id
        })
      )

      // When
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('autorise un jeune quand il est le créateur', async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idCreateur: utilisateur.id }))

      // When
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('autorise un conseiller quand un de ses jeunes est présent', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      const idJeuneDuConseiller = '1'
      fichierRepository.getFichierMetadata
        .withArgs(idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [idJeuneDuConseiller] }))
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(utilisateur.id)
        .resolves([unJeune()])

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
      fichierRepository.getFichierMetadata.withArgs(idFichier).resolves(
        unFichierMetadata({
          idsJeunes: ['un-autre-jeune'],
          idCreateur: 'un-autre-createur'
        })
      )
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(utilisateur.id)
        .resolves(['id-jeune-conseiller'])

      // When
      const result = await fichierAuthorizer.autoriserTelechargementDuFichier(
        idFichier,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })

    it('autorise le conseiller quand un de ses jeunes est le créateur', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      fichierRepository.getFichierMetadata.withArgs(idFichier).resolves(
        unFichierMetadata({
          idsJeunes: [],
          idCreateur: 'id-jeune-conseiller',
          typeCreateur: Authentification.Type.JEUNE
        })
      )
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(utilisateur.id)
        .resolves(['id-jeune-conseiller'])

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

  describe('autoriserTeleversementDuFichier', () => {
    it('autorise un conseiller pour ses jeunes', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      authorizeConseillerForJeunes.autoriserConseillerPourSesJeunes
        .withArgs(['id-jeune'], utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await fichierAuthorizer.autoriserTeleversementDuFichier(
        utilisateur,
        ['id-jeune']
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('autorise un conseiller pour ses listes de diffusion', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('id-liste-diffusion', utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await fichierAuthorizer.autoriserTeleversementDuFichier(
        utilisateur,
        undefined,
        ['id-liste-diffusion']
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('refuse un conseiller pour une liste de diffusion qui ne lui appartient pas', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      authorizeConseillerForJeunes.autoriserConseillerPourSesJeunes
        .withArgs(['id-jeune'], utilisateur)
        .resolves(emptySuccess())
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('id-liste-diffusion-1', utilisateur)
        .resolves(emptySuccess())
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('id-liste-diffusion-2', utilisateur)
        .resolves(failure(new DroitsInsuffisants()))

      // When
      const result = await fichierAuthorizer.autoriserTeleversementDuFichier(
        utilisateur,
        ['id-jeune'],
        ['id-liste-diffusion-1', 'id-liste-diffusion-2']
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})
