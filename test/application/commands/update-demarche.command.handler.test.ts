import {
  UpdateStatutDemarcheCommand,
  UpdateStatutDemarcheCommandHandler
} from '../../../src/application/commands/update-demarche.command.handler'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Demarche } from '../../../src/domain/demarche'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import {
  emptySuccess,
  failure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { uneDemarche } from '../../fixtures/demarche.fixture'
import { Core } from '../../../src/domain/core'

describe('UpdateDemarcheCommandHandler', () => {
  let updateDemarcheCommandHandler: UpdateStatutDemarcheCommandHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let demarcheFactory: StubbedClass<Demarche.Factory>
  let demarcheRepository: StubbedType<Demarche.Repository>
  const utilisateur = unUtilisateurJeune()
  const demarche = uneDemarche()

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    demarcheFactory = stubClass(Demarche.Factory)
    demarcheRepository = stubInterface(sandbox)

    updateDemarcheCommandHandler = new UpdateStatutDemarcheCommandHandler(
      jeuneAuthorizer,
      evenementService,
      demarcheFactory,
      demarcheRepository
    )
  })

  describe('handle', () => {
    describe('quand il y a un nouveau statut', () => {
      const command: UpdateStatutDemarcheCommand = {
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        dateDebut: demarche.dateDebut,
        idDemarche: demarche.id,
        statut: Demarche.Statut.EN_COURS,
        dateFin: uneDatetime()
      }

      describe('quand la mise a jour se passe bien', () => {
        it('met a jour le statut et renvoie un succès', async () => {
          // Given
          const demarcheModifiee: Demarche.Modifiee = {
            id: 'idDemarche',
            statut: Demarche.Statut.EN_COURS,
            dateModification: uneDatetime(),
            dateFin: uneDatetime(),
            dateDebut: uneDatetime()
          }
          demarcheFactory.mettreAJourLeStatut
            .withArgs(
              command.idDemarche,
              command.statut,
              command.dateFin,
              command.dateDebut
            )
            .returns(success(demarcheModifiee))

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
            dateModification: uneDatetime(),
            dateDebut: uneDatetime(),
            dateFin: uneDatetime()
          }
          demarcheFactory.mettreAJourLeStatut
            .withArgs(
              command.idDemarche,
              command.statut!,
              command.dateFin,
              command.dateDebut
            )
            .returns(success(demarcheModifiee))

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
      const command: UpdateStatutDemarcheCommand = {
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        idDemarche: demarche.id,
        statut: demarche.statut,
        dateFin: demarche.dateFin
      }

      // When
      await updateDemarcheCommandHandler.authorize(command, utilisateur)

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idJeune,
        utilisateur,
        Core.structuresPoleEmploiBRSA
      )
    })
  })

  describe('monitor', () => {
    it('monitore la modification de la démarche', async () => {
      // When
      await updateDemarcheCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_STATUT_MODIFIE,
        utilisateur
      )
    })
  })
})
