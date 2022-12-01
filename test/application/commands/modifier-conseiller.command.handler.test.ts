import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import {
  ModifierConseillerCommand,
  ModifierConseillerCommandHandler
} from '../../../src/application/commands/modifier-conseiller.command.handler'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  failure,
  Failure,
  success
} from '../../../src/building-blocks/types/result'
import { Agence } from '../../../src/domain/agence'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { Core } from '../../../src/domain/core'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect, stubClass } from '../../utils'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import Structure = Core.Structure

describe('ModifierConseillerCommandHandler', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let agencesRepository: StubbedType<Agence.Repository>
  let conseillerFactory: StubbedType<Conseiller.Factory>
  let modifierConseillerCommandHandler: ModifierConseillerCommandHandler

  const conseillerQuiExiste: Conseiller = {
    id: 'id qui existe',
    firstName: 'Jean michel',
    lastName: 'Conseiller',
    structure: Structure.MILO,
    email: 'mail@mail.mail',
    dateVerificationMessages: undefined,
    agence: undefined,
    nomAgenceManuel: undefined,
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
    conseillerFactory = stubClass(Conseiller.Factory)

    modifierConseillerCommandHandler = new ModifierConseillerCommandHandler(
      conseillerRepository,
      agencesRepository,
      conseillerFactory
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
          conseillerFactory.mettreAJour.returns(success(conseillerPEmaj))

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
          conseillerFactory.mettreAJour.returns(success(conseillerMiloMaj))

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
          conseillerFactory.mettreAJour.returns(
            failure(
              new MauvaiseCommandeError(
                'Un conseiller MILO doit choisir une Agence du référentiel'
              )
            )
          )

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
    describe('Quand on est un jeune', () => {
      it('on reçoit une unauthorized', async () => {
        // Given
        const command = {
          idConseiller: 'id qui existe',
          agence: {
            id: 'agence qui existe'
          }
        }

        // When
        const result = await modifierConseillerCommandHandler.execute(
          command,
          unUtilisateurJeune()
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe('Quand on est un conseiller avec le mauvais id', () => {
      it('on reçoit une unauthorized', async () => {
        // Given
        const query = {
          idConseiller: 'id qui existe',
          agence: {
            id: 'agence qui existe'
          }
        }

        // When
        const result = await modifierConseillerCommandHandler.execute(
          query,
          unUtilisateurConseiller()
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
