import {
  CreateCampagneCommand,
  CreateCampagneCommandHandler
} from '../../../src/application/commands/create-campagne.command'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Campagne } from '../../../src/domain/campagne'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { SinonSandbox } from 'sinon'
import { uneCampagne } from '../../fixtures/campagne.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import { CampagneExisteDejaError } from '../../../src/building-blocks/types/domain-error'
import {
  unUtilisateurConseiller,
  unUtilisateurSupport
} from '../../fixtures/authentification.fixture'
import { Unauthorized } from '../../../src/domain/erreur'

describe('CreateCampagneCommandHandler', () => {
  let campagneRepository: StubbedType<Campagne.Repository>
  let campagneFactory: StubbedClass<Campagne.Factory>
  let createCampagneCommandeHandler: CreateCampagneCommandHandler

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    campagneRepository = stubInterface(sandbox)
    campagneFactory = stubClass(Campagne.Factory)
    createCampagneCommandeHandler = new CreateCampagneCommandHandler(
      campagneRepository,
      campagneFactory
    )
  })

  describe('handle', () => {
    const command: CreateCampagneCommand = {
      nom: 'unNom',
      dateDebut: uneDatetime,
      dateFin: uneDatetime.plus({ week: 2 })
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
      dateDebut: uneDatetime,
      dateFin: uneDatetime.plus({ week: 2 })
    }

    describe("quand c'est quelqu'un du support", () => {
      it('autorise', async () => {
        // When
        const call = createCampagneCommandeHandler.authorize(
          command,
          unUtilisateurSupport()
        )

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })

    describe("quand c'est quelqu'un qui n'est pas du support", () => {
      it('rejette', async () => {
        // When
        const call = createCampagneCommandeHandler.authorize(
          command,
          unUtilisateurConseiller()
        )

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
