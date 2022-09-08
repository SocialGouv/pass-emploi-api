import {
  CreateDemarcheCommand,
  CreateDemarcheCommandHandler
} from '../../../src/application/commands/create-demarche.command.handler'
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
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { uneDemarche } from '../../fixtures/demarche.fixture'

describe('CreateDemarcheCommandHandler', () => {
  let createDemarcheCommandHandler: CreateDemarcheCommandHandler
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let demarcheFactory: StubbedClass<Demarche.Factory>
  let demarcheRepository: StubbedType<Demarche.Repository>
  const utilisateur = unUtilisateurJeune()
  const demarche = uneDemarche()

  const command: CreateDemarcheCommand = {
    idJeune: 'idJeune',
    accessToken: 'accessToken',
    dateFin: demarche.dateFin,
    description: 'ma démarche'
  }
  const demarcheCreee: Demarche.Creee = {
    statut: Demarche.Statut.A_FAIRE,
    dateCreation: uneDatetime,
    dateFin: uneDatetime,
    pourquoi: 'P01',
    quoi: 'Q38',
    description: command.description
  }

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    evenementService = stubClass(EvenementService)
    demarcheFactory = stubClass(Demarche.Factory)
    demarcheRepository = stubInterface(sandbox)

    createDemarcheCommandHandler = new CreateDemarcheCommandHandler(
      jeunePoleEmploiAuthorizer,
      evenementService,
      demarcheFactory,
      demarcheRepository
    )
  })

  describe('handle', () => {
    describe('quand la creation se passe bien', () => {
      it('met a jour le statut et renvoie un succès', async () => {
        // Given
        demarcheFactory.creerDemarche
          .withArgs({
            description: command.description,
            dateFin: command.dateFin,
            comment: undefined,
            quoi: undefined,
            pourquoi: undefined
          })
          .returns(success(demarcheCreee))

        demarcheRepository.save
          .withArgs(demarcheCreee, command.accessToken)
          .resolves(emptySuccess())

        // When
        const result = await createDemarcheCommandHandler.handle(command)

        // Then
        expect(isSuccess(result)).to.be.true()
      })
    })
    describe('quand il y a une erreur lors de la creation', () => {
      it("transmet l'erreur", async () => {
        // Given
        demarcheFactory.creerDemarche
          .withArgs({
            description: command.description,
            dateFin: command.dateFin,
            comment: undefined,
            quoi: undefined,
            pourquoi: undefined
          })
          .returns(success(demarcheCreee))

        const erreurHttp = failure(new ErreurHttp("C'est mauvais", 400))
        demarcheRepository.save
          .withArgs(demarcheCreee, command.accessToken)
          .resolves(erreurHttp)

        // When
        const result = await createDemarcheCommandHandler.handle(command)

        // Then
        expect(result).to.be.deep.equal(erreurHttp)
      })
    })
  })

  describe('authorize', () => {
    it('autorise les jeunes pole emploi', async () => {
      // When
      await createDemarcheCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly(command.idJeune, utilisateur)
    })
  })

  describe('monitor', () => {
    it('monitore la creation de la démarche', async () => {
      // When
      await createDemarcheCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_CREEE,
        utilisateur
      )
    })
  })
})
