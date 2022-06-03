import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { Unauthorized } from 'src/domain/erreur'
import { Jeune } from 'src/domain/jeune'
import { ObjectStorageClient } from 'src/infrastructure/clients/object-storage.client'
import { unJeune } from 'test/fixtures/jeune.fixture'
import {
  TelechargerFichierQuery,
  TelechargerFichierQueryHandler
} from '../../../src/application/queries/telecharger-fichier.query.handler'
import { success } from '../../../src/building-blocks/types/result'
import { Fichier } from '../../../src/domain/fichier'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('TelechargerFichierQueryHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let objectStorageClient: StubbedClass<ObjectStorageClient>
  let telechargerFichierQueryHandler: TelechargerFichierQueryHandler

  const query: TelechargerFichierQuery = {
    idFichier: 'test'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    objectStorageClient = stubClass(ObjectStorageClient)
    telechargerFichierQueryHandler = new TelechargerFichierQueryHandler(
      fichierRepository,
      jeuneRepository,
      objectStorageClient
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller quand un de ses jeunes est présent', async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      const idJeuneDuConseiller = '1'
      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [idJeuneDuConseiller] }))
      jeuneRepository.findAllJeunesByConseiller
        .withArgs([idJeuneDuConseiller], utilisateur.id)
        .resolves([unJeune()])

      // When
      const call = await telechargerFichierQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(call).to.be.equal(undefined)
    })
    it("n'autorise pas le conseiller quand aucun de ses jeunes n'est présent", async () => {
      //Given
      const utilisateur = unUtilisateurConseiller()
      const idJeuneDuConseiller = '1'
      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [idJeuneDuConseiller] }))
      jeuneRepository.findAllJeunesByConseiller
        .withArgs([idJeuneDuConseiller], utilisateur.id)
        .resolves([])

      // When
      const call = telechargerFichierQueryHandler.authorize(query, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
    })
    it('autorise un jeune quand il est présent', async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [utilisateur.id] }))

      // When
      const call = await telechargerFichierQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(call).to.be.equal(undefined)
    })
    it("n'autorise pas le jeune quand il n'est pas présent", async () => {
      //Given
      const utilisateur = unUtilisateurJeune()
      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(unFichierMetadata({ idsJeunes: [] }))

      // When
      const call = telechargerFichierQueryHandler.authorize(query, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
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
      objectStorageClient.download.withArgs(fichierMetadata).resolves(url)

      // When
      const result = await telechargerFichierQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(success(url))
    })
  })
})
