import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SupportAuthorizer } from '../../../../src/application/authorizers/support-authorizer'
import {
  CreateCampagneCommand,
  CreateCampagneCommandHandler
} from '../../../../src/application/commands/campagne/create-campagne.command.handler'
import { CampagneExisteDejaError } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { Campagne } from '../../../../src/domain/campagne'
import { unUtilisateurSupport } from '../../../fixtures/authentification.fixture'
import { uneCampagne } from '../../../fixtures/campagne.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../../utils'
import { Planificateur } from '../../../../src/domain/planificateur'
import { DateService } from '../../../../src/utils/date-service'

describe('CreateCampagneCommandHandler', () => {
  let campagneRepository: StubbedType<Campagne.Repository>
  let campagneFactory: StubbedClass<Campagne.Factory>
  let supportAuthorizer: StubbedClass<SupportAuthorizer>
  let createCampagneCommandeHandler: CreateCampagneCommandHandler
  let planificateurRepository: Planificateur.Repository
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    campagneRepository = stubInterface(sandbox)
    campagneFactory = stubClass(Campagne.Factory)
    supportAuthorizer = stubClass(SupportAuthorizer)
    planificateurRepository = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
    createCampagneCommandeHandler = new CreateCampagneCommandHandler(
      campagneRepository,
      campagneFactory,
      supportAuthorizer,
      planificateurRepository,
      dateService
    )
  })

  describe('handle', () => {
    describe('quand il y a une campagne existante sur ces dates ou ce nom', () => {
      it('rejette', async () => {
        // Given
        const command: CreateCampagneCommand = {
          nom: 'unNom',
          dateDebut: uneDatetime(),
          dateFin: uneDatetime().plus({ week: 2 })
        }
        campagneRepository.getByIntervalOrName.resolves(uneCampagne())

        // When
        const result = await createCampagneCommandeHandler.handle(command)

        // Then
        expect(result).to.deep.equal(failure(new CampagneExisteDejaError()))
      })
    })

    describe("quand c'est une brand new campagne", () => {
      it('la créer', async () => {
        // Given
        const command: CreateCampagneCommand = {
          nom: 'unNom',
          dateDebut: uneDatetime(),
          dateFin: uneDatetime().plus({ week: 2 })
        }
        const campagne = uneCampagne()
        campagneRepository.getByIntervalOrName
          .withArgs(command.dateDebut, command.dateFin, command.nom)
          .resolves(undefined)

        campagneFactory.creer.withArgs(command).returns(campagne)

        // When
        const result = await createCampagneCommandeHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success({ id: campagne.id }))
        expect(campagneRepository.save).to.have.been.calledWithExactly(campagne)
        expect(planificateurRepository.creerJob).to.have.been.calledTwice()
      })
      it('la créer et planifie une seule notif', async () => {
        // Given
        const command: CreateCampagneCommand = {
          nom: 'unNom',
          dateDebut: uneDatetime(),
          dateFin: uneDatetime().plus({ days: 7 })
        }
        const campagne = uneCampagne()
        campagneRepository.getByIntervalOrName
          .withArgs(command.dateDebut, command.dateFin, command.nom)
          .resolves(undefined)

        campagneFactory.creer.withArgs(command).returns(campagne)

        // When
        const result = await createCampagneCommandeHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success({ id: campagne.id }))
        expect(campagneRepository.save).to.have.been.calledWithExactly(campagne)
        expect(
          planificateurRepository.creerJob
        ).to.have.been.calledOnceWithExactly({
          dateExecution: uneDatetime()
            .plus({ days: 1 })
            .setZone('Europe/Paris')
            .set({
              hour: 11,
              minute: 40,
              second: 0,
              millisecond: 0
            })
            .toJSDate(),
          type: Planificateur.JobType.NOTIFIER_CAMPAGNE,
          contenu: {
            offset: 0,
            idCampagne: campagne.id,
            nbNotifsEnvoyees: 0
          }
        })
      })
    })
  })

  describe('authorize', () => {
    const command: CreateCampagneCommand = {
      nom: 'unNom',
      dateDebut: uneDatetime(),
      dateFin: uneDatetime().plus({ week: 2 })
    }

    it('autorise le support', async () => {
      // When
      await createCampagneCommandeHandler.authorize(
        command,
        unUtilisateurSupport()
      )

      // Then
      expect(supportAuthorizer.autoriserSupport).to.have.been.calledWithExactly(
        unUtilisateurSupport()
      )
    })
  })
})
