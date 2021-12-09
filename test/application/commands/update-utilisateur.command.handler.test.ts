import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  NonTrouveError,
  UtilisateurMiloNonValide
} from 'src/building-blocks/types/domain-error'
import { Authentification } from 'src/domain/authentification'
import { IdService } from 'src/utils/id-service'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unUtilisateurQueryModel } from 'test/fixtures/query-models/authentification.query-model.fixtures'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../../src/application/commands/update-utilisateur.command.handler'
import {
  failure,
  isFailure,
  isSuccess
} from '../../../src/building-blocks/types/result'
import { expect } from '../../utils'

describe('UpdateUtilisateurCommandHandler', () => {
  let authentificationRepository: StubbedType<Authentification.Repository>
  let updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler
  const idService: IdService = { uuid: () => '1', generate: () => '1' }
  const authentificationFactory: Authentification.Factory =
    new Authentification.Factory(idService)

  before(() => {
    const sandbox: SinonSandbox = createSandbox()
    authentificationRepository = stubInterface(sandbox)

    updateUtilisateurCommandHandler = new UpdateUtilisateurCommandHandler(
      authentificationRepository,
      authentificationFactory
    )
  })

  describe('execute', () => {
    describe('conseiller venant du SSO PASS_EMPLOI', async () => {
      describe('conseiller connu', async () => {
        it('retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Authentification.Structure.PASS_EMPLOI
          }

          const utilisateur = unUtilisateurConseiller()
          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
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
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
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

    describe('conseiller venant du SSO MILO ou Pole Emploi', async () => {
      describe('conseiller connu', async () => {
        it('retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Authentification.Structure.MILO
          }

          const utilisateur = unUtilisateurConseiller()
          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
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
        describe('quand il est valide', () => {
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
              .withArgs(
                command.idUtilisateurAuth,
                command.structure,
                command.type
              )
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
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data).to.deep.equal(unUtilisateurQueryModel())
            }
          })
        })

        describe('quand il lui manque des info', () => {
          it('retourne une failure', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              type: Authentification.Type.CONSEILLER,
              idUtilisateurAuth: 'nilstavernier',
              structure: Authentification.Structure.MILO
            }

            authentificationRepository.get
              .withArgs(
                command.idUtilisateurAuth,
                command.structure,
                command.type
              )
              .resolves(undefined)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(isFailure(result)).equal(true)
            if (isFailure(result)) {
              expect(result.error.code).to.equal(UtilisateurMiloNonValide.CODE)
            }
          })
        })
      })
    })

    describe('jeune venant du SSO PASS_EMPLOI', async () => {
      describe('jeune connu', async () => {
        it('retourne le jeune', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.JEUNE,
            structure: Authentification.Structure.PASS_EMPLOI
          }

          const utilisateur = unUtilisateurConseiller()
          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
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
      describe('jeune inconnu', async () => {
        it('retourne une erreur', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.JEUNE,
            structure: Authentification.Structure.PASS_EMPLOI
          }

          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
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

    describe('jeune venant du SSO MILO ou Pole Emploi', async () => {
      describe('jeune connu par son sub', async () => {
        it('retourne le jeune', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.JEUNE,
            structure: Authentification.Structure.MILO
          }

          const utilisateur = unUtilisateurConseiller()
          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
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
      describe('jeune connu par son email', async () => {
        it('retourne le jeune et enregistre le sub', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            email: 'abc@test.com',
            type: Authentification.Type.JEUNE,
            structure: Authentification.Structure.MILO
          }

          const utilisateur = unUtilisateurConseiller()
          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
            .resolves(undefined)
          authentificationRepository.getJeuneMiloByEmail
            .withArgs(command.email)
            .resolves(utilisateur)
          authentificationRepository.updateJeuneMilo
            .withArgs('id-jeune', command.idUtilisateurAuth)
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
      describe('jeune non connu par son email', async () => {
        it('retourne une failure', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            email: 'abc@test.com',
            type: Authentification.Type.JEUNE,
            structure: Authentification.Structure.MILO
          }

          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
            .resolves(undefined)
          authentificationRepository.getJeuneMiloByEmail
            .withArgs(command.email)
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
  })
})
