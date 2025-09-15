import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { createSandbox } from 'sinon'
import { FichierAuthorizer } from 'src/application/authorizers/fichier-authorizer'
import { testConfig } from 'test/utils/module-for-testing'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler,
  TeleverserFichierCommandOutput
} from '../../../src/application/commands/televerser-fichier.command.handler'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../../src/building-blocks/types/result'
import { Chat } from '../../../src/domain/chat'
import { Fichier } from '../../../src/domain/fichier'
import { Conseiller } from '../../../src/domain/conseiller'
import { Planificateur } from '../../../src/domain/planificateur'
import { DateService } from '../../../src/utils/date-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unFichier } from '../../fixtures/fichier.fixture'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('TeleverserFichierCommandHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>
  let fichierFactory: StubbedClass<Fichier.Factory>
  let fichierAuthorizer: StubbedClass<FichierAuthorizer>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let televerserFichierCommandHandler: TeleverserFichierCommandHandler

  const command: TeleverserFichierCommand = {
    fichier: {
      buffer: Buffer.alloc(1),
      mimeType: 'jpg',
      name: 'fichier-test.jpg',
      size: 1000
    },
    jeunesIds: ['1'],
    idMessage: 'id-message'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    listeDeDiffusionRepository = stubInterface(sandbox)
    fichierFactory = stubClass(Fichier.Factory)
    fichierAuthorizer = stubClass(FichierAuthorizer)
    planificateurRepository = stubInterface(sandbox)

    const dateService = stubClass(DateService)
    dateService.now.returns(DateTime.fromISO('2024-04-12T12:00:00'))

    televerserFichierCommandHandler = new TeleverserFichierCommandHandler(
      fichierRepository,
      chatRepository,
      listeDeDiffusionRepository,
      fichierFactory,
      fichierAuthorizer,
      planificateurRepository,
      testConfig(),
      dateService
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
        expect(fichierRepository.save).to.have.been.calledOnceWithExactly(
          fichier
        )
        expect(result).to.deep.equal(
          success({
            id: fichier.id,
            nom: fichier.nom
          })
        )
      })

      describe('quand l’utilisateur est un conseiller', () => {
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
          expect(fichierRepository.save).to.have.been.calledOnceWithExactly(
            fichier
          )
          expect(fichierFactory.creer).to.have.been.calledOnceWithExactly({
            ...commandAvecListeDeDiffusion,
            jeunesIds: [
              liste.beneficiaires[0].id,
              ...commandAvecListeDeDiffusion.jeunesIds!
            ],
            createur: { id: utilisateur.id, type: utilisateur.type }
          })
          expect(result).to.deep.equal(
            success({ id: fichier.id, nom: fichier.nom })
          )
        })
      })

      describe('quand l’utilisateur est un jeune', () => {
        let result: Result<TeleverserFichierCommandOutput>
        const fichier = unFichier({ idsJeunes: [] })
        const utilisateur = unUtilisateurJeune()

        beforeEach(async () => {
          // Given
          const liste = uneListeDeDiffusion()
          listeDeDiffusionRepository.findAll.withArgs(['1']).resolves([liste])

          fichierFactory.creer.returns(success(fichier))
          fichierRepository.declencherAnalyseAsynchrone.resolves(emptySuccess())

          // When
          result = await televerserFichierCommandHandler.handle(
            command,
            utilisateur
          )
        })

        it('televerse le fichier sans jeune ou liste de diffusion', async () => {
          // Then
          expect(fichierRepository.save).to.have.been.calledOnceWithExactly(
            fichier
          )
          expect(fichierFactory.creer).to.have.been.calledOnceWithExactly({
            ...command,
            jeunesIds: [],
            createur: { id: utilisateur.id, type: utilisateur.type }
          })
          expect(result).to.deep.equal(
            success({ id: fichier.id, nom: fichier.nom })
          )
        })

        it("déclenche l'analyse du fichier par l'antivirus", async () => {
          expect(
            fichierRepository.declencherAnalyseAsynchrone
          ).to.have.been.calledOnceWithExactly(fichier)
          expect(
            chatRepository.envoyerStatutAnalysePJ
          ).to.have.been.calledOnceWithExactly(
            utilisateur.id,
            command.idMessage,
            'ANALYSE_EN_COURS'
          )
          expect(
            planificateurRepository.ajouterJob
          ).to.have.been.calledOnceWithExactly({
            dateExecution: new Date('2024-04-12T12:00:15'),
            type: Planificateur.JobType.RECUPERER_ANALYSE_ANTIVIRUS,
            contenu: { idFichier: fichier.id }
          })
        })
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

      describe('quand l’utilisateur est un conseiller', () => {
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

      describe('quand l’utilisateur est un jeune', () => {
        describe('quand il n’y a pas d’id de message', () => {
          it('retourne une failure', async () => {
            // Given
            const command: TeleverserFichierCommand = {
              fichier: {
                buffer: Buffer.alloc(1),
                mimeType: 'jpg',
                name: 'fichier-test.jpg',
                size: 1000
              }
            }

            // When
            const result = await televerserFichierCommandHandler.handle(
              command,
              unUtilisateurJeune()
            )

            // Then
            expect(result).to.deep.equal(
              failure(new MauvaiseCommandeError('Id du message manquant'))
            )
          })
        })
      })
    })
  })
})
