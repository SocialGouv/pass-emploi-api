import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Conseiller } from '../../../src/domain/conseiller'
import { Agence } from '../../../src/domain/agence'
import { createSandbox, expect } from '../../utils'
import { failure, Failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { Core } from '../../../src/domain/core'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { Unauthorized } from '../../../src/domain/erreur'
import Structure = Core.Structure
import { ModifierConseillerCommandHandler } from '../../../src/application/commands/modifier-conseiller.command.handler'

describe('ModifierConseillerQueryHandler', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let agencesRepository: StubbedType<Agence.Repository>
  let handler: ModifierConseillerCommandHandler

  const conseillerQuiExiste: Conseiller = {
    id: 'id qui existe',
    firstName: 'Jean michel',
    lastName: 'Conseiller',
    structure: Structure.MILO,
    email: 'mail@mail.mail',
    dateVerificationMessages: undefined,
    agence: undefined,
    nomAgenceManuel: undefined
  }

  const agenceQuiExiste: Agence = {
    id: 'agence qui existe',
    nom: 'Bonjour, je suis une agence'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    agencesRepository = stubInterface(sandbox)

    handler = new ModifierConseillerCommandHandler(
      conseillerRepository,
      agencesRepository
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
        const result = await handler.handle(query)

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
        const result = await handler.handle(query)

        // Then
        expect(result._isSuccess).to.equal(false)
        expect((result as Failure).error).to.deep.equal(
          new NonTrouveError('Agence', "agence qui n'existe pas")
        )
      })
    })

    describe("Quand le conseiller et l'agence existent", () => {
      it('le conseiller est bien modifié', async function () {
        // Given
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
          .resolves(agenceQuiExiste)

        // When
        const result = await handler.handle(query)

        // Then
        expect(result._isSuccess).to.equal(true)
      })
    })
  })

  describe('authorize', () => {
    describe('Quand on est un jeune', () => {
      it('on reçoit une unauthorized', async () => {
        // Given
        const query = {
          idConseiller: 'id qui existe',
          agence: {
            id: 'agence qui existe'
          }
        }

        // When
        const call = handler.execute(query, unUtilisateurJeune())

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
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
        const call = handler.execute(query, unUtilisateurConseiller())

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })

  describe('Quand on est un conseiller avec le bon id', () => {
    const query = {
      idConseiller: 'id qui existe',
      agence: {
        id: 'agence qui existe'
      }
    }

    beforeEach(() => {
      agencesRepository.get
        .withArgs('agence qui existe')
        .resolves(agenceQuiExiste)
      agencesRepository.getStructureOfAgence
        .withArgs('agence qui existe')
        .resolves(Structure.MILO)
    })

    describe("et que l'agence et le conseiller ont la même structure", () => {
      it('on modifie le conseiller', async () => {
        // When
        const call = handler.execute(
          query,
          unUtilisateurConseiller({
            structure: Core.Structure.MILO,
            id: 'id qui existe'
          })
        )

        // Then
        await expect(call).to.not.be.rejected
      })
    })

    describe("et que l'agence et le conseiller n'ont pas la même structure", () => {
      it('on reçoi un unauthorized', async () => {
        // When
        const result = await handler.execute(
          query,
          unUtilisateurConseiller({
            structure: Core.Structure.POLE_EMPLOI,
            id: 'id qui existe'
          })
        )

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Conseiller', 'id qui existe'))
        )
      })
    })
  })
})
