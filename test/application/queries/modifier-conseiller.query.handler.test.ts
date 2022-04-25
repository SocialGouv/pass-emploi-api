import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Conseiller } from '../../../src/domain/conseiller'
import { Agence } from '../../../src/domain/agence'
import { ModifierConseillerCommandHandler } from '../../../src/application/queries/modifier-conseiller-command.handler'
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

describe('ModifierConseillerQueryHandler', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let agencesRepository: StubbedType<Agence.Repository>
  let handler: ModifierConseillerCommandHandler

  const conseillerQuiExiste: Conseiller = {
    id: 'id qui éxiste',
    firstName: 'Jean michel',
    lastName: 'Conseiller',
    structure: Structure.MILO,
    email: 'mail@mail.mail',
    dateVerificationMessages: undefined,
    agence: undefined,
    nomAgenceManuel: undefined
  }

  const agenceQuiExiste: Agence = {
    id: 'agence qui éxiste',
    nom: 'Bonjour, je suis une agence'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    agencesRepository = stubInterface(sandbox)

    handler = new ModifierConseillerCommandHandler(
      conseillerRepository,
      agencesRepository,
      new Conseiller.Factory()
    )
  })

  describe('handle', () => {
    describe("Quand le conseiller n'éxiste pas", () => {
      it('on doit avoir une erreur 404', async () => {
        // When
        const query = {
          idConseiller: "id qui n'éxiste pas",
          champsConseillerAModifier: {}
        }
        conseillerRepository.get
          .withArgs("id qui n'éxiste pas")
          .resolves(undefined)

        // Given
        const result = await handler.handle(query)

        // Then
        expect(result._isSuccess).to.equal(false)
        const expectedError = new NonTrouveError(
          'Conseiller',
          "id qui n'éxiste pas"
        )
        expect((result as Failure).error).to.deep.equal(expectedError)
      })
    })

    describe("Quand l'agence n'éxiste pas", () => {
      it('on doit avoir une erreur 404', async () => {
        // When
        const query = {
          idConseiller: 'id qui éxiste',
          agence: {
            id: "agence qui n'éxiste pas"
          }
        }
        conseillerRepository.get
          .withArgs('id qui éxiste')
          .resolves(conseillerQuiExiste)
        agencesRepository.get
          .withArgs("agence qui n'éxiste pas")
          .resolves(undefined)

        // Given
        const result = await handler.handle(query)

        // Then
        expect(result._isSuccess).to.equal(false)
        expect((result as Failure).error).to.deep.equal(
          new NonTrouveError('Agence', "agence qui n'éxiste pas")
        )
      })
    })

    describe("Quand le conseiller et l'agence éxistent", () => {
      it('le conseiller est bien modifié', async function () {
        // Given
        const query = {
          idConseiller: 'id qui éxiste',
          agence: {
            id: "agence qui n'éxiste pas"
          }
        }
        conseillerRepository.get
          .withArgs('id qui éxiste')
          .resolves(conseillerQuiExiste)
        agencesRepository.get
          .withArgs("agence qui n'éxiste pas")
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
          idConseiller: 'id qui éxiste',
          agence: {
            id: 'agence qui éxiste'
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
          idConseiller: 'id qui éxiste',
          agence: {
            id: 'agence qui éxiste'
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
      idConseiller: 'id qui éxiste',
      agence: {
        id: 'agence qui éxiste'
      }
    }

    beforeEach(() => {
      agencesRepository.get
        .withArgs('agence qui éxiste')
        .resolves(agenceQuiExiste)
      agencesRepository.getStructureOfAgence
        .withArgs('agence qui éxiste')
        .resolves(Structure.MILO)
    })

    describe("et que l'agence et le conseiller ont la même structure", () => {
      it('on modifie le conseiller', async () => {
        // When
        const call = handler.execute(
          query,
          unUtilisateurConseiller({
            structure: Core.Structure.MILO,
            id: 'id qui éxiste'
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
            id: 'id qui éxiste'
          })
        )

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Conseiller', 'id qui éxiste'))
        )
      })
    })
  })
})
