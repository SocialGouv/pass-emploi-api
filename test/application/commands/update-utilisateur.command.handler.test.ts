import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  NonTrouveError,
  ConseillerNonValide,
  NonTraitableError
} from 'src/building-blocks/types/domain-error'
import { Authentification } from 'src/domain/authentification'
import { IdService } from 'src/utils/id-service'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import {
  unUtilisateurQueryModel,
  unUtilisateurSansEmailQueryModel
} from 'test/fixtures/query-models/authentification.query-model.fixtures'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../../src/application/commands/update-utilisateur.command.handler'
import {
  failure,
  isFailure,
  isSuccess,
  Result
} from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import { expect, StubbedClass, stubClass } from '../../utils'
import { PlanificateurService } from '../../../src/domain/planificateur'
import { UtilisateurQueryModel } from '../../../src/application/queries/query-models/authentification.query-models'

describe('UpdateUtilisateurCommandHandler', () => {
  let authentificationRepository: StubbedType<Authentification.Repository>
  let updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler
  const uuidGenere = '1'
  const idService: IdService = {
    uuid: () => uuidGenere,
    generate: () => '1'
  }
  const authentificationFactory: Authentification.Factory =
    new Authentification.Factory(idService)
  let planificateurService: StubbedClass<PlanificateurService>
  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    authentificationRepository = stubInterface(sandbox)
    planificateurService = stubClass(PlanificateurService)
    updateUtilisateurCommandHandler = new UpdateUtilisateurCommandHandler(
      authentificationRepository,
      authentificationFactory,
      planificateurService
    )
  })

  describe('execute', () => {
    describe('conseiller venant du SSO PASS_EMPLOI', async () => {
      describe('conseiller connu', async () => {
        let result: Result<UtilisateurQueryModel>
        beforeEach(async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Core.Structure.PASS_EMPLOI
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
          result = await updateUtilisateurCommandHandler.execute(command)
        })
        it('retourne le conseiller', async () => {
          // Then
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data).to.deep.equal(unUtilisateurQueryModel())
          }
        })
        it('ne planifie pas de jobs', async () => {
          // Then
          expect(planificateurService.planifierJobRappelMail).to.have.callCount(
            0
          )
        })
      })
      describe('conseiller inconnu', async () => {
        it('retourne une erreur', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Core.Structure.PASS_EMPLOI
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
            structure: Core.Structure.MILO
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
          let result: Result<UtilisateurQueryModel>
          beforeEach(async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              nom: 'Tavernier',
              prenom: 'Nils',
              type: Authentification.Type.CONSEILLER,
              email: 'Nils.Tavernier@Passemploi.com',
              idUtilisateurAuth: 'nilstavernier',
              structure: Core.Structure.MILO
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
            result = await updateUtilisateurCommandHandler.execute(command)
          })
          it('crée et retourne le conseiller avec un mail minusculisé', async () => {
            // Then
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data).to.deep.equal(unUtilisateurQueryModel())
            }
          })
          it('planifie un job pour le conseiller', async () => {
            // Then
            expect(
              planificateurService.planifierJobRappelMail
            ).to.have.been.calledWith(uuidGenere)
          })
        })
        describe("quand il est valide mais il manque l' email", () => {
          it('crée et retourne le conseiller', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              nom: 'Tavernier',
              prenom: 'Nils',
              type: Authentification.Type.CONSEILLER,
              idUtilisateurAuth: 'nilstavernier',
              structure: Core.Structure.MILO
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
              expect(result.data).to.deep.equal(
                unUtilisateurSansEmailQueryModel()
              )
            }
          })
        })
        describe('quand il lui manque les infos nom et prenom', () => {
          it('retourne une failure', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              type: Authentification.Type.CONSEILLER,
              idUtilisateurAuth: 'nilstavernier',
              structure: Core.Structure.MILO,
              email: 'Un-Email@valide.fr'
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
              expect(result.error.code).to.equal(ConseillerNonValide.CODE)
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
            structure: Core.Structure.PASS_EMPLOI
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
            structure: Core.Structure.PASS_EMPLOI
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
            structure: Core.Structure.MILO
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
            email: 'ABC@test.com',
            type: Authentification.Type.JEUNE,
            structure: Core.Structure.MILO
          }

          const utilisateur = unUtilisateurConseiller()
          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
            .resolves(undefined)
          authentificationRepository.getJeuneByEmail
            .withArgs('abc@test.com')
            .resolves(utilisateur)
          authentificationRepository.updateJeune
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
            structure: Core.Structure.MILO
          }

          authentificationRepository.get
            .withArgs(
              command.idUtilisateurAuth,
              command.structure,
              command.type
            )
            .resolves(undefined)
          authentificationRepository.getJeuneByEmail
            .withArgs(command.email)
            .resolves(undefined)

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(result).to.deep.equal(
            failure(
              new NonTraitableError('Utilisateur', command.idUtilisateurAuth)
            )
          )
        })
      })
    })
  })
})
