import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { Authentification } from 'src/domain/authentification'
import { ObjectStorageClient } from 'src/infrastructure/clients/object-storage.client'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from 'test/fixtures/authentification.fixture'
import { stubClassSandbox } from 'test/utils/types'
import {
  TelechargerFichierQuery,
  TelechargerFichierQueryHandler
} from '../../../src/application/queries/telecharger-fichier.query.handler'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Fichier } from '../../../src/domain/fichier'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import { expect, StubbedClass } from '../../utils'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { RessourceIndisponibleError } from 'src/building-blocks/types/domain-error'
import { FichierAuthorizer } from '../../../src/application/authorizers/fichier-authorizer'

describe('TelechargerFichierQueryHandler', () => {
  const sandbox = createSandbox()
  let fichierRepository: StubbedType<Fichier.Repository>
  let fichierAuthorizer: StubbedClass<FichierAuthorizer>
  let objectStorageClient: StubbedClass<ObjectStorageClient>
  let evenementService: StubbedClass<EvenementService>
  let telechargerFichierQueryHandler: TelechargerFichierQueryHandler

  const query: TelechargerFichierQuery = {
    idFichier: 'test'
  }

  beforeEach(() => {
    fichierRepository = stubInterface(sandbox)
    fichierAuthorizer = stubClassSandbox(FichierAuthorizer, sandbox)
    objectStorageClient = stubClassSandbox(ObjectStorageClient, sandbox)
    evenementService = stubClassSandbox(EvenementService, sandbox)
    telechargerFichierQueryHandler = new TelechargerFichierQueryHandler(
      fichierRepository,
      fichierAuthorizer,
      objectStorageClient,
      evenementService
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it("valide que l'utilisateur est bien autorisé à télécharger le fichier", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      const idFichier = '1'

      // When
      await telechargerFichierQueryHandler.authorize({ idFichier }, utilisateur)

      // Then
      expect(
        fichierAuthorizer.autoriserTelechargementDuFichier
      ).to.have.been.calledWithExactly(idFichier, utilisateur)
    })
  })

  describe('handle', () => {
    it("retourne l'url du fichier", async () => {
      // Given
      const url = 'test'
      const fichierMetadata = unFichierMetadata()

      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(fichierMetadata)
      objectStorageClient.getUrlPresignee
        .withArgs(fichierMetadata)
        .resolves(url)

      // When
      const result = await telechargerFichierQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(success({ metadata: fichierMetadata, url }))
    })

    it('retourne une failure quand le fichier a une date de suppression', async () => {
      // Given
      const fichierMetadata = unFichierMetadata({ dateSuppression: new Date() })

      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(fichierMetadata)

      // When
      const result = await telechargerFichierQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(
          new RessourceIndisponibleError(
            "Le fichier test n'est plus disponible"
          )
        )
      )
    })
  })
  describe('monitor', () => {
    it('envoie un évènement de récuperation d’une piece jointe d´un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await telechargerFichierQueryHandler.monitor(
        utilisateur,
        { idFichier: 'test' },
        success({
          metadata: unFichierMetadata({
            typeCreateur: Authentification.Type.CONSEILLER
          }),
          url: 'pouet'
        })
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.PIECE_JOINTE_CONSEILLER_TELECHARGEE,
        utilisateur
      )
    })

    it('envoie un évènement de récuperation d’une piece jointe', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await telechargerFichierQueryHandler.monitor(
        utilisateur,
        { idFichier: 'test' },
        success({
          metadata: unFichierMetadata({
            typeCreateur: Authentification.Type.JEUNE
          }),
          url: 'pouet'
        })
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.PIECE_JOINTE_BENEFICIAIRE_TELECHARGEE,
        utilisateur
      )
    })
  })
})
