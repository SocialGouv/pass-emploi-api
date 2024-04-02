import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { FichierAuthorizer } from 'src/application/authorizers/fichier-authorizer'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler
} from '../../../src/application/commands/televerser-fichier.command.handler'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/milo/conseiller'
import { Fichier } from '../../../src/domain/fichier'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unFichier } from '../../fixtures/fichier.fixture'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('TeleverserFichierCommandHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let fichierFactory: StubbedClass<Fichier.Factory>
  let fichierAuthorizer: StubbedClass<FichierAuthorizer>
  let televerserFichierCommandHandler: TeleverserFichierCommandHandler

  const command: TeleverserFichierCommand = {
    fichier: {
      buffer: Buffer.alloc(1),
      mimeType: 'jpg',
      name: 'fichier-test.jpg',
      size: 1000
    },
    jeunesIds: ['1']
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    listeDeDiffusionRepository = stubInterface(sandbox)
    fichierFactory = stubClass(Fichier.Factory)
    fichierAuthorizer = stubClass(FichierAuthorizer)
    televerserFichierCommandHandler = new TeleverserFichierCommandHandler(
      fichierRepository,
      listeDeDiffusionRepository,
      fichierFactory,
      fichierAuthorizer
    )
  })

  describe('authorize', () => {
    it('autorise le téléversement du fichier', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      fichierAuthorizer.autoriserTeleversementDuFichier
        .withArgs(utilisateur, command.jeunesIds, command.listesDeDiffusionIds)
        .resolves(emptySuccess())

      // When
      const result = await televerserFichierCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(
        fichierAuthorizer.autoriserTeleversementDuFichier
      ).to.have.been.called()
      expect(result).to.deep.equal(emptySuccess())
    })
  })

  describe('handle', () => {
    describe('quand la commande est valide', () => {
      it('televerse le fichier et retourne son id', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        const fichier = unFichier()
        fichierFactory.creer
          .withArgs({
            ...command,
            jeunesIds: command.jeunesIds!,
            createur: { id: utilisateur.id, type: utilisateur.type }
          })
          .returns(success(fichier))

        // When
        const result = await televerserFichierCommandHandler.handle(
          command,
          utilisateur
        )

        // Then
        expect(fichierRepository.save).to.have.been.calledWithExactly(fichier)
        expect(result).to.deep.equal(
          success({
            id: fichier.id,
            nom: fichier.nom
          })
        )
      })

      it('televerse le fichier avec jeunes de liste de diffusion et retourne son id', async () => {
        // Given
        const commandAvecListeDeDiffusion = {
          ...command,
          listesDeDiffusionIds: ['1']
        }
        const liste = uneListeDeDiffusion()
        listeDeDiffusionRepository.findAll.withArgs(['1']).resolves([liste])

        const fichier = unFichier()
        fichierFactory.creer.returns(success(fichier))

        // When
        const utilisateur = unUtilisateurConseiller()
        const result = await televerserFichierCommandHandler.handle(
          commandAvecListeDeDiffusion,
          utilisateur
        )

        // Then
        expect(fichierRepository.save).to.have.been.calledWithExactly(fichier)
        expect(fichierFactory.creer).to.have.been.calledWithExactly({
          ...commandAvecListeDeDiffusion,
          jeunesIds: [
            liste.beneficiaires[0].id,
            ...commandAvecListeDeDiffusion.jeunesIds!
          ],
          createur: { id: utilisateur.id, type: utilisateur.type }
        })
        expect(result).to.deep.equal(
          success({
            id: fichier.id,
            nom: fichier.nom
          })
        )
      })

      it('televerse le fichier sans jeune ou liste de diffusion si le création est un jeune', async () => {
        // Given
        const commandAvecListeDeDiffusion = {
          ...command,
          listesDeDiffusionIds: ['1']
        }
        const liste = uneListeDeDiffusion()
        listeDeDiffusionRepository.findAll.withArgs(['1']).resolves([liste])

        const fichier = unFichier({ idsJeunes: [] })
        fichierFactory.creer.returns(success(fichier))

        // When
        const utilisateur = unUtilisateurJeune()
        const result = await televerserFichierCommandHandler.handle(
          commandAvecListeDeDiffusion,
          utilisateur
        )

        // Then
        expect(fichierRepository.save).to.have.been.calledWithExactly(fichier)
        expect(fichierFactory.creer).to.have.been.calledWithExactly({
          ...commandAvecListeDeDiffusion,
          jeunesIds: [],
          createur: { id: utilisateur.id, type: utilisateur.type }
        })
        expect(result).to.deep.equal(
          success({
            id: fichier.id,
            nom: fichier.nom
          })
        )
      })
    })

    describe('quand la commande est invalide', () => {
      describe("quand le fichier n'est pas valide", () => {
        it('retourne une failure', async () => {
          // Given
          const utilisateur = unUtilisateurConseiller()
          const echec = failure(new MauvaiseCommandeError('Fichier'))
          fichierFactory.creer
            .withArgs({
              ...command,
              jeunesIds: command.jeunesIds!,
              createur: { id: utilisateur.id, type: utilisateur.type }
            })
            .returns(echec)

          // When
          const result = await televerserFichierCommandHandler.handle(
            command,
            utilisateur
          )

          // Then
          expect(fichierRepository.save).not.to.have.been.called()
          expect(result).to.deep.equal(echec)
        })
      })

      describe("quand il n'y a ni liste de diffusion ni jeunes", () => {
        it('retourne une failure', async () => {
          // Given
          const command: TeleverserFichierCommand = {
            fichier: {
              buffer: Buffer.alloc(1),
              mimeType: 'jpg',
              name: 'fichier-test.jpg',
              size: 1000
            },
            jeunesIds: [],
            listesDeDiffusionIds: []
          }
          // When
          const result = await televerserFichierCommandHandler.handle(
            command,
            unUtilisateurConseiller()
          )

          // Then
          expect(result).to.deep.equal(
            failure(
              new MauvaiseCommandeError('Aucun jeune ou liste de diffusion')
            )
          )
        })
      })
    })
  })
})
