import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { Authentification } from 'src/domain/authentification'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { ListeDeDiffusionAuthorizer } from '../../../src/application/authorizers/liste-de-diffusion-authorizer'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler
} from '../../../src/application/commands/televerser-fichier.command.handler'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { Fichier } from '../../../src/domain/fichier'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unFichier } from '../../fixtures/fichier.fixture'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('TeleverserFichierCommandHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let fichierFactory: StubbedClass<Fichier.Factory>
  let authorizeConseillerForJeunes: StubbedClass<ConseillerAuthorizer>
  let authorizeListeDeDiffusion: StubbedClass<ListeDeDiffusionAuthorizer>
  let televerserFichierCommandHandler: TeleverserFichierCommandHandler

  const command: TeleverserFichierCommand = {
    fichier: {
      buffer: Buffer.alloc(1),
      mimeType: 'jpg',
      name: 'fichier-test.jpg',
      size: 1000
    },
    jeunesIds: ['1'],
    createur: {
      id: '1',
      type: Authentification.Type.CONSEILLER
    }
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    listeDeDiffusionRepository = stubInterface(sandbox)
    fichierFactory = stubClass(Fichier.Factory)
    authorizeConseillerForJeunes = stubClass(ConseillerAuthorizer)
    authorizeListeDeDiffusion = stubClass(ListeDeDiffusionAuthorizer)
    televerserFichierCommandHandler = new TeleverserFichierCommandHandler(
      fichierRepository,
      listeDeDiffusionRepository,
      fichierFactory,
      authorizeConseillerForJeunes,
      authorizeListeDeDiffusion
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller pour ses jeunes', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      authorizeConseillerForJeunes.autoriserConseillerPourSesJeunes
        .withArgs(command.jeunesIds!, utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await televerserFichierCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('autorise un conseiller pour ses listes de diffusion', async () => {
      // Given
      const commandAvecListeDeDiffusion = {
        ...command,
        jeunesIds: undefined,
        listesDeDiffusionIds: ['1']
      }
      const utilisateur = unUtilisateurConseiller()
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('1', utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await televerserFichierCommandHandler.authorize(
        commandAvecListeDeDiffusion,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('refuse un conseiller pour une liste de diffusion qui ne lui appartient pas', async () => {
      // Given
      const commandAvecListeDeDiffusion = {
        ...command,
        listesDeDiffusionIds: ['1', '2']
      }
      const utilisateur = unUtilisateurConseiller()
      authorizeConseillerForJeunes.autoriserConseillerPourSesJeunes
        .withArgs(command.jeunesIds!, utilisateur)
        .resolves(emptySuccess())
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('1', utilisateur)
        .resolves(emptySuccess())
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('2', utilisateur)
        .resolves(failure(new DroitsInsuffisants()))

      // When
      const result = await televerserFichierCommandHandler.authorize(
        commandAvecListeDeDiffusion,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('handle', () => {
    describe('quand la commande est valide', () => {
      it('televerse le fichier et retourne son id', async () => {
        // Given
        const fichier = unFichier()
        fichierFactory.creer
          .withArgs({ ...command, jeunesIds: command.jeunesIds! })
          .returns(success(fichier))

        // When
        const result = await televerserFichierCommandHandler.handle(command)

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
        const result = await televerserFichierCommandHandler.handle(
          commandAvecListeDeDiffusion
        )

        // Then
        expect(fichierRepository.save).to.have.been.calledWithExactly(fichier)
        expect(fichierFactory.creer).to.have.been.calledWithExactly({
          ...commandAvecListeDeDiffusion,
          jeunesIds: [
            liste.beneficiaires[0].id,
            ...commandAvecListeDeDiffusion.jeunesIds!
          ]
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
          const echec = failure(new MauvaiseCommandeError('Fichier'))
          fichierFactory.creer
            .withArgs({ ...command, jeunesIds: command.jeunesIds! })
            .returns(echec)

          // When
          const result = await televerserFichierCommandHandler.handle(command)

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
            createur: {
              id: '1',
              type: Authentification.Type.CONSEILLER
            },
            jeunesIds: [],
            listesDeDiffusionIds: []
          }
          // When
          const result = await televerserFichierCommandHandler.handle(command)

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
