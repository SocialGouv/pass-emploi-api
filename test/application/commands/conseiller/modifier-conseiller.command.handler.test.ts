import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import {
  ModifierConseillerCommand,
  ModifierConseillerCommandHandler
} from '../../../../src/application/commands/conseiller/modifier-conseiller.command.handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import { Failure } from '../../../../src/building-blocks/types/result'
import { Agence } from '../../../../src/domain/agence'
import { Conseiller } from '../../../../src/domain/milo/conseiller'
import { Core } from '../../../../src/domain/core'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../../utils'
import Structure = Core.Structure

describe('ModifierConseillerCommandHandler', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let agencesRepository: StubbedType<Agence.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let modifierConseillerCommandHandler: ModifierConseillerCommandHandler

  const conseillerQuiExiste: Conseiller = {
    id: 'id qui existe',
    firstName: 'Jean michel',
    lastName: 'Conseiller',
    structure: Structure.MILO,
    email: 'mail@mail.mail',
    dateVerificationMessages: undefined,
    agence: undefined,
    notificationsSonores: false
  }

  const agenceQuiExiste: Agence = {
    id: 'agence qui existe',
    nom: 'Bonjour, je suis une agence'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    agencesRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    modifierConseillerCommandHandler = new ModifierConseillerCommandHandler(
      conseillerRepository,
      agencesRepository,
      conseillerAuthorizer
    )
  })

  describe('handle', () => {
    describe("Quand le conseiller n'existe pas", () => {
      it('on doit avoir une erreur 404', async () => {
        // When
        const query = {
          idConseiller: "id qui n'existe pas",
          champsConseillerAModifier: {}
        }
        conseillerRepository.get
          .withArgs("id qui n'existe pas")
          .resolves(undefined)

        // Given
        const result = await modifierConseillerCommandHandler.handle(query)

        // Then
        expect(result._isSuccess).to.equal(false)
        const expectedError = new NonTrouveError(
          'Conseiller',
          "id qui n'existe pas"
        )
        expect((result as Failure).error).to.deep.equal(expectedError)
      })
    })

    describe("Quand l'agence n'existe pas", () => {
      it('on doit avoir une erreur 404', async () => {
        // When
        const query = {
          idConseiller: 'id qui existe',
          agence: {
            id: "agence qui n'existe pas"
          }
        }
        conseillerRepository.get
          .withArgs('id qui existe')
          .resolves(conseillerQuiExiste)
        agencesRepository.get
          .withArgs("agence qui n'existe pas")
          .resolves(undefined)

        // Given
        const result = await modifierConseillerCommandHandler.handle(query)

        // Then
        expect(result._isSuccess).to.equal(false)
        expect((result as Failure).error).to.deep.equal(
          new NonTrouveError('Agence', "agence qui n'existe pas")
        )
      })
    })

    describe('Quand le conseiller et l‘agence existent', () => {
      let command: ModifierConseillerCommand
      const idConseiller = 'id-conseiller'
      beforeEach(() => {
        // Given
        command = {
          idConseiller,
          agence: {
            id: 'id-agence'
          },
          notificationsSonores: true
        }
      })
      describe('quand le conseiller vient de Pôle Emploi', () => {
        it('modifie le conseiller', async () => {
          // Given
          const conseillerPE = unConseiller({
            id: idConseiller,
            structure: Structure.POLE_EMPLOI
          })
          const conseillerPEmaj = unConseiller({
            id: idConseiller,
            structure: Structure.POLE_EMPLOI,
            agence: { id: 'id-agence' },
            notificationsSonores: true
          })

          conseillerRepository.get
            .withArgs('id-conseiller')
            .resolves(conseillerPE)
          agencesRepository.get.withArgs('id-agence').resolves(agenceQuiExiste)

          // When
          const result = await modifierConseillerCommandHandler.handle(command)

          // Then

          expect(result._isSuccess).to.equal(true)
          expect(conseillerRepository.save).to.have.been.calledWithExactly(
            conseillerPEmaj
          )
        })
      })
      describe('quand le conseiller vient de Mission Locale', () => {
        it('modifie le conseiller avec une agence du référentiel', async () => {
          // Given
          const conseillerMilo = unConseiller({
            id: idConseiller,
            structure: Structure.MILO
          })
          const conseillerMiloMaj = unConseiller({
            id: idConseiller,
            structure: Structure.MILO,
            agence: { id: 'id-agence' },
            notificationsSonores: true
          })

          conseillerRepository.get
            .withArgs('id-conseiller')
            .resolves(conseillerMilo)
          agencesRepository.get.withArgs('id-agence').resolves(agenceQuiExiste)

          // When
          const result = await modifierConseillerCommandHandler.handle(command)

          // Then
          expect(result._isSuccess).to.equal(true)
          expect(conseillerRepository.save).to.have.been.calledWithExactly(
            conseillerMiloMaj
          )
        })
        it('échoue pour une agence hors référentiel', async () => {
          // Given
          const conseillerMilo = unConseiller({
            id: idConseiller,
            structure: Structure.MILO
          })
          command = {
            idConseiller,
            agence: {
              nom: 'nom-agence'
            },
            notificationsSonores: true
          }

          conseillerRepository.get
            .withArgs('id-conseiller')
            .resolves(conseillerMilo)

          // When
          const result = await modifierConseillerCommandHandler.handle(command)

          // Then
          expect((result as Failure).error).to.be.instanceOf(
            MauvaiseCommandeError
          )
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise le conseiller', async () => {
      // Given
      const command = {
        idConseiller: 'id qui existe',
        agence: {
          id: 'agence qui existe'
        }
      }
      const utilisateur = unUtilisateurConseiller()

      // When
      await modifierConseillerCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledOnceWithExactly(command.idConseiller, utilisateur)
    })
  })
})
