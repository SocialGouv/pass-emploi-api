import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  ConseillerNonValide,
  NonTraitableError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from 'test/fixtures/authentification.fixture'
import { uneDate } from 'test/fixtures/date.fixture'
import {
  unUtilisateurQueryModel,
  unUtilisateurSansEmailQueryModel
} from 'test/fixtures/query-models/authentification.query-model.fixtures'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../../src/application/commands/update-utilisateur.command.handler'
import { UtilisateurQueryModel } from '../../../src/application/queries/query-models/authentification.query-model'
import {
  failure,
  isFailure,
  isSuccess,
  Result
} from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import { expect, stubClass } from '../../utils'

describe('UpdateUtilisateurCommandHandler', () => {
  let authentificationRepository: StubbedType<Authentification.Repository>
  let updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler
  const dateService = stubClass(DateService)
  dateService.nowJs.returns(uneDate())
  const uuidGenere = '1'
  const idService: IdService = {
    uuid: () => uuidGenere
  }
  const authentificationFactory: Authentification.Factory =
    new Authentification.Factory(idService)
  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    authentificationRepository = stubInterface(sandbox)
    updateUtilisateurCommandHandler = new UpdateUtilisateurCommandHandler(
      authentificationRepository,
      authentificationFactory,
      dateService
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
      })
      describe('conseiller connu avec nouvel email, nom et prenom', async () => {
        it('met à jour ses infos et retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Core.Structure.PASS_EMPLOI,
            email: 'New@email.com',
            nom: 'newNom',
            prenom: 'newPrenom'
          }

          const utilisateur = unUtilisateurConseiller({
            idAuthentification: command.idUtilisateurAuth
          })
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
          expect(
            authentificationRepository.update
          ).to.have.been.calledWithExactly({
            ...utilisateur,
            email: 'new@email.com',
            nom: 'newNom',
            prenom: 'newPrenom',
            dateDerniereConnexion: uneDate()
          })
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data.email).to.deep.equal('new@email.com')
          }
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
      describe('conseiller connu avec nouvel email, nom et prenom', async () => {
        it('met à jour ses infos et retourne le conseiller', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            type: Authentification.Type.CONSEILLER,
            structure: Core.Structure.MILO,
            email: 'New@email.com',
            nom: 'newNom',
            prenom: 'newPrenom'
          }

          const utilisateur = unUtilisateurConseiller({
            idAuthentification: command.idUtilisateurAuth
          })
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
          expect(
            authentificationRepository.update
          ).to.have.been.calledWithExactly({
            ...utilisateur,
            email: 'new@email.com',
            nom: 'newNom',
            prenom: 'newPrenom',
            dateDerniereConnexion: uneDate()
          })
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            expect(result.data.email).to.deep.equal('new@email.com')
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
              structure: command.structure,
              roles: []
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
              structure: command.structure,
              roles: []
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
        describe('avec nouvel email, nom et prenom', async () => {
          it('met à jour ses infos et retourne le jeune', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.MILO,
              email: 'New@email.com',
              nom: 'newNom',
              prenom: 'newPrenom'
            }

            const utilisateur = unUtilisateurJeune({
              idAuthentification: command.idUtilisateurAuth
            })
            authentificationRepository.get
              .withArgs(
                command.idUtilisateurAuth,
                command.structure,
                command.type
              )
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(
              authentificationRepository.update
            ).to.have.been.calledWithExactly({
              ...utilisateur,
              email: 'new@email.com',
              nom: 'newNom',
              prenom: 'newPrenom',
              dateDerniereConnexion: uneDate()
            })
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data.email).to.deep.equal('new@email.com')
            }
          })
        })
      })
      describe('jeune connu par son email', async () => {
        it('retourne le jeune et enregistre le sub + mise à jour date premiere connexion', async () => {
          // Given
          const command: UpdateUtilisateurCommand = {
            idUtilisateurAuth: 'nilstavernier',
            nom: 'nom',
            prenom: 'prenom',
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
          authentificationRepository.updateJeunePremiereConnexion
            .withArgs('id-jeune', command.idUtilisateurAuth, uneDate())
            .resolves()

          // When
          const result = await updateUtilisateurCommandHandler.execute(command)

          // Then
          expect(isSuccess(result)).equal(true)
          if (isSuccess(result)) {
            const expectedUtilisateur = unUtilisateurQueryModel()
            expectedUtilisateur.nom = command.nom!
            expectedUtilisateur.prenom = command.prenom!
            expect(result.data).to.deep.equal(expectedUtilisateur)
            expect(
              authentificationRepository.updateJeunePremiereConnexion
            ).to.have.been.calledWithExactly(
              utilisateur.id,
              command.nom,
              command.prenom,
              command.idUtilisateurAuth,
              uneDate()
            )
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
