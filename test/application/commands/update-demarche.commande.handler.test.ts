import {
  UpdateDemarcheCommand,
  UpdateDemarcheCommandHandler
} from '../../../src/application/commands/update-demarche.commande.handler'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Demarche } from '../../../src/domain/demarche'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import {
  emptySuccess,
  failure,
  isSuccess
} from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { uneDemarche } from '../../fixtures/demarche.fixture'

describe('UpdateDemarcheCommandHandler', () => {
  let updateDemarcheCommandHandler: UpdateDemarcheCommandHandler
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let demarcheFactory: StubbedClass<Demarche.Factory>
  let demarcheRepository: StubbedType<Demarche.Repository>
  const utilisateur = unUtilisateurJeune()
  const demarche = uneDemarche()

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    evenementService = stubClass(EvenementService)
    demarcheFactory = stubClass(Demarche.Factory)
    demarcheRepository = stubInterface(sandbox)

    updateDemarcheCommandHandler = new UpdateDemarcheCommandHandler(
      jeunePoleEmploiAuthorizer,
      evenementService,
      demarcheFactory,
      demarcheRepository
    )
  })

  describe('handle', () => {
    describe('quand il y a un nouveau statut', () => {
      const command: UpdateDemarcheCommand = {
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        demarcheInitiale: demarche,
        statut: Demarche.Statut.EN_COURS
      }

      describe('quand la mise a jour se passe bien', () => {
        it('met a jour le statut et renvoie un succès', async () => {
          // Given
          const demarcheModifiee: Demarche.Modifiee = {
            id: 'idDemarche',
            statut: Demarche.Statut.EN_COURS,
            dateModification: uneDatetime,
            dateDebut: uneDatetime
          }
          demarcheFactory.mettreAJourLeStatut
            .withArgs(demarche, command.statut!)
            .returns(demarcheModifiee)

          demarcheRepository.update
            .withArgs(demarcheModifiee, command.accessToken)
            .resolves(emptySuccess())

          // When
          const result = await updateDemarcheCommandHandler.handle(command)

          // Then
          expect(isSuccess(result)).to.be.true()
        })
      })
      describe('quand il y a une erreur lors de la mise a jour', () => {
        it("transmet l'erreur", async () => {
          // Given
          const demarcheModifiee: Demarche.Modifiee = {
            id: 'idDemarche',
            statut: Demarche.Statut.EN_COURS,
            dateModification: uneDatetime,
            dateDebut: uneDatetime
          }
          demarcheFactory.mettreAJourLeStatut
            .withArgs(demarche, command.statut!)
            .returns(demarcheModifiee)

          const erreurHttp = failure(new ErreurHttp("C'est mauvais", 400))
          demarcheRepository.update
            .withArgs(demarcheModifiee, command.accessToken)
            .resolves(erreurHttp)

          // When
          const result = await updateDemarcheCommandHandler.handle(command)

          // Then
          expect(result).to.be.deep.equal(erreurHttp)
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise les jeunes pole emploi', async () => {
      // Given
      const command: UpdateDemarcheCommand = {
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        demarcheInitiale: demarche
      }

      // When
      await updateDemarcheCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly(command.idJeune, utilisateur)
    })
  })

  describe('monitor', () => {
    it('monitore la modification de la démarche', async () => {
      // When
      await updateDemarcheCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWithExactly(
        Evenement.Type.DEMARCHE_MODIFIEE,
        utilisateur
      )
    })
  })
})
