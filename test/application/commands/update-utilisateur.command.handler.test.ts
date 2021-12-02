import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from 'src/application/commands/update-utilisateur.command.handler'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Authentification } from 'src/domain/authentification'
import { IdService } from 'src/utils/id-service'
import { unUtilisateur } from 'test/fixtures/authentification.fixture'
import { unUtilisateurQueryModel } from 'test/fixtures/query-models/authentification.query-model.fixtures'
import { failure, isSuccess } from '../../../src/building-blocks/types/result'
import { expect } from '../../utils'

describe('UpdateUtilisateurCommandHandler', () => {
  let authentificationRepository: StubbedType<Authentification.Repository>
  let updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler
  const idService: IdService = { uuid: () => '', generate: () => '1' }

  before(() => {
    const sandbox: SinonSandbox = createSandbox()
    authentificationRepository = stubInterface(sandbox)

    updateUtilisateurCommandHandler = new UpdateUtilisateurCommandHandler(
      authentificationRepository,
      idService
    )
  })

  describe.only('execute', () => {
    describe('token venant du SSO PASS_EMPLOI', async () => {
      describe('conseiller connu', async () => {
        it('retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Authentification.Structure.PASS_EMPLOI
          }

          const utilisateur = unUtilisateur()
          authentificationRepository.get
            .withArgs(command.idUtilisateurAuth, command.type)
            .resolves(utilisateur)

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(unUtilisateurQueryModel())
          }
        })
      })
      describe('conseiller inconnu', async () => {
        it('retourne une erreur', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Authentification.Structure.PASS_EMPLOI
          }

          authentificationRepository.get
            .withArgs(command.idUtilisateurAuth, command.type)
            .resolves(undefined)

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(result).to.deep.equal(
            failure(
              new NonTrouveError('Utilisateur', command.idUtilisateurAuth)
            )
          )
        })
      })
    })

    describe('token venant du SSO MILO', async () => {
      describe('conseiller connu', async () => {
        it('retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Authentification.Structure.MILO
          }

          const utilisateur = unUtilisateur()
          authentificationRepository.get
            .withArgs(command.idUtilisateurAuth, command.type)
            .resolves(utilisateur)

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(unUtilisateurQueryModel())
          }
        })
      })
      describe('conseiller inconnu', async () => {
        it('crée et retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            nom: 'Tavernier',
            prenom: 'Nils',
            type: Authentification.Type.CONSEILLER,
            email: 'nils.tavernier@passemploi.com',
            idUtilisateurAuth: 'nilstavernier',
            structure: Authentification.Structure.MILO
          }

          authentificationRepository.get
            .withArgs(command.idUtilisateurAuth, command.type)
            .resolves(undefined)

          const utilisateur: Authentification.Utilisateur = {
            id: '1',
            prenom: command.prenom || '',
            nom: command.nom || '',
            email: command.email,
            type: command.type,
            structure: command.structure
          }
          authentificationRepository.save
            .withArgs(utilisateur, command.idUtilisateurAuth)
            .resolves()

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(unUtilisateurQueryModel())
          }
        })
      })
    })

    describe('token non valide', async () => {
      it('retourne une erreur', async () => {
        // Given
        const command: UpdateUtilisateurCommand = {
          idUtilisateurAuth: 'nilstavernier',
          type: Authentification.Type.CONSEILLER,
          structure: Authentification.Structure.POLE_EMPLOI
        }

        // When
        const result = await updateUtilisateurCommandHandler.execute(command)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Utilisateur', command.idUtilisateurAuth))
        )
      })
    })
  })
})
