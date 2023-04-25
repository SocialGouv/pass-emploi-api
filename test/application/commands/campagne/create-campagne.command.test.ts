import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SupportAuthorizer } from 'src/application/authorizers/support-authorizer'
import { Authentification } from 'src/domain/authentification'
import {
  CreateCampagneCommand,
  CreateCampagneCommandHandler
} from '../../../../src/application/commands/campagne/create-campagne.command'
import { CampagneExisteDejaError } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { Campagne } from '../../../../src/domain/campagne'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { uneCampagne } from '../../../fixtures/campagne.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('CreateCampagneCommandHandler', () => {
  let campagneRepository: StubbedType<Campagne.Repository>
  let campagneFactory: StubbedClass<Campagne.Factory>
  let createCampagneCommandeHandler: CreateCampagneCommandHandler
  let supportAuthorizer: StubbedClass<SupportAuthorizer>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    campagneRepository = stubInterface(sandbox)
    campagneFactory = stubClass(Campagne.Factory)
    supportAuthorizer = stubClass(SupportAuthorizer)
    createCampagneCommandeHandler = new CreateCampagneCommandHandler(
      campagneRepository,
      campagneFactory,
      supportAuthorizer
    )
  })

  describe('handle', () => {
    const command: CreateCampagneCommand = {
      nom: 'unNom',
      dateDebut: uneDatetime(),
      dateFin: uneDatetime().plus({ week: 2 })
    }
    describe('quand il y a une campagne existante sur ces dates ou ce nom', () => {
      it('rejette', async () => {
        // Given
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
      })
    })
  })

  describe('authorize', () => {
    const command: CreateCampagneCommand = {
      nom: 'unNom',
      dateDebut: uneDatetime(),
      dateFin: uneDatetime().plus({ week: 2 })
    }
    const utilisateur: Authentification.Utilisateur = unUtilisateurConseiller()

    it('autorise le support', async () => {
      // When
      await createCampagneCommandeHandler.authorize(
        command,
        unUtilisateurConseiller()
      )

      // Then
      expect(supportAuthorizer.autoriserSupport).to.have.been.calledWithExactly(
        utilisateur
      )
    })
  })
})
