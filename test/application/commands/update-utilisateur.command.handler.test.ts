import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox, createSandbox } from 'sinon'
import {
  ConseillerNonValide,
  NonTraitableError,
  NonTraitableInexistantError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune,
  unUtilisateurJeunePasConnecte
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
  Result,
  failure,
  isFailure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import { MailBrevoService } from '../../../src/infrastructure/clients/mail-brevo.service.db'
import { StubbedClass, expect, stubClass } from '../../utils'

describe('UpdateUtilisateurCommandHandler', () => {
  let authentificationRepository: StubbedType<Authentification.Repository>
  let updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler
  const dateService = stubClass(DateService)
  const maintenant = DateService.fromJSDateToDateTime(uneDate())!
  dateService.nowJs.returns(maintenant.toJSDate())
  dateService.now.returns(maintenant)
  let mailBrevoService: StubbedClass<MailBrevoService>
  const uuidGenere = '1'
  const idService: IdService = {
    uuid: () => uuidGenere
  }
  const authentificationFactory: Authentification.Factory =
    new Authentification.Factory(idService)

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    authentificationRepository = stubInterface(sandbox)
    mailBrevoService = stubClass(MailBrevoService)
    updateUtilisateurCommandHandler = new UpdateUtilisateurCommandHandler(
      authentificationRepository,
      authentificationFactory,
      dateService,
      mailBrevoService
    )
  })

  describe('execute', () => {
    describe('Conseiller', () => {
      describe("conseiller venant de l'idp PASS_EMPLOI", async () => {
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
            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
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
            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
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

            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
              .resolves(undefined)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(new NonTrouveError(command.idUtilisateurAuth))
            )
          })
        })
      })

      describe("conseiller venant de l'idp MILO ou Pole Emploi", async () => {
        describe('conseiller connu', async () => {
          it('retourne le conseiller', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.CONSEILLER,
              structure: Core.Structure.MILO
            }

            const utilisateur = unUtilisateurConseiller()
            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(
              mailBrevoService.envoyerEmailCreationConseillerMilo
            ).to.have.callCount(0)
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data).to.deep.equal(unUtilisateurQueryModel())
            }
          })
        })
        describe('conseiller connu avec nouvel email, nom et prenom', async () => {
          it('met à jour ses infos et retourne le conseiller sans envoi email quand date trop passée', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.CONSEILLER,
              structure: Core.Structure.MILO,
              email: 'New@email.com',
              nom: 'newNom',
              prenom: 'newPrenom'
            }

            const ilYa5Semaines = maintenant.minus({ weeks: 5 }).toJSDate()

            const utilisateur = unUtilisateurConseiller({
              idAuthentification: command.idUtilisateurAuth,
              email: undefined,
              datePremiereConnexion: ilYa5Semaines
            })
            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
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
              dateDerniereConnexion: uneDate(),
              datePremiereConnexion: ilYa5Semaines
            })
            expect(
              mailBrevoService.envoyerEmailCreationConseillerMilo
            ).not.to.have.called()
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data.email).to.deep.equal('new@email.com')
            }
          })
          it('met à jour ses infos et retourne le conseiller sans envoi email quand mail existant', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.CONSEILLER,
              structure: Core.Structure.MILO,
              email: 'New@email.com',
              nom: 'newNom',
              prenom: 'newPrenom'
            }

            const ilYa1Semaine = maintenant.minus({ weeks: 1 }).toJSDate()

            const utilisateur = unUtilisateurConseiller({
              idAuthentification: command.idUtilisateurAuth,
              email: 'old',
              datePremiereConnexion: ilYa1Semaine
            })
            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
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
              dateDerniereConnexion: uneDate(),
              datePremiereConnexion: ilYa1Semaine
            })
            expect(
              mailBrevoService.envoyerEmailCreationConseillerMilo
            ).not.to.have.called()
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data.email).to.deep.equal('new@email.com')
            }
          })
          it('met à jour ses infos et retourne le conseiller avec envoi email', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.CONSEILLER,
              structure: Core.Structure.MILO,
              email: 'New@email.com',
              nom: 'newNom',
              prenom: 'newPrenom'
            }

            const ilYaUneSemaine = maintenant.minus({ weeks: 1 }).toJSDate()

            const utilisateur = unUtilisateurConseiller({
              idAuthentification: command.idUtilisateurAuth,
              email: undefined,
              datePremiereConnexion: ilYaUneSemaine
            })
            authentificationRepository.getConseillerByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
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
              dateDerniereConnexion: uneDate(),
              datePremiereConnexion: ilYaUneSemaine
            })
            expect(
              mailBrevoService.envoyerEmailCreationConseillerMilo
            ).to.have.calledOnceWithExactly({
              ...utilisateur,
              email: 'new@email.com',
              nom: 'newNom',
              prenom: 'newPrenom',
              dateDerniereConnexion: uneDate(),
              datePremiereConnexion: ilYaUneSemaine
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
            const command: UpdateUtilisateurCommand = {
              nom: 'Tavernier',
              prenom: 'Nils',
              type: Authentification.Type.CONSEILLER,
              email: 'Nils.Tavernier@Passemploi.com',
              idUtilisateurAuth: 'nilstavernier',
              structure: Core.Structure.MILO
            }

            beforeEach(() => {
              // Given
              authentificationRepository.getConseillerByStructure
                .withArgs(command.idUtilisateurAuth, command.structure)
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
            })
            it('crée et retourne le conseiller avec un email minusculisé', async () => {
              // When
              result = await updateUtilisateurCommandHandler.execute(command)

              // Then
              expect(isSuccess(result)).equal(true)
              if (isSuccess(result)) {
                expect(result.data).to.deep.equal(unUtilisateurQueryModel())
              }
            })
            describe('Pôle Emploi', () => {
              it('n’envoie pas d’email de bienvenue', async () => {
                // Given
                const command: UpdateUtilisateurCommand = {
                  nom: 'Tavernier',
                  prenom: 'Nils',
                  type: Authentification.Type.CONSEILLER,
                  email: 'Nils.Tavernier@Passemploi.com',
                  idUtilisateurAuth: 'nilstavernier',
                  structure: Core.Structure.POLE_EMPLOI
                }
                // When
                result = await updateUtilisateurCommandHandler.execute(command)
                // Then
                expect(
                  mailBrevoService.envoyerEmailCreationConseillerMilo
                ).to.have.callCount(0)
              })
            })
            describe('Mission Locale', () => {
              it('envoie un email de bienvenue', async () => {
                // When
                result = await updateUtilisateurCommandHandler.execute(command)
                // Then
                expect(
                  mailBrevoService.envoyerEmailCreationConseillerMilo
                ).to.have.been.calledOnce()
              })
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

              authentificationRepository.getConseillerByStructure
                .withArgs(command.idUtilisateurAuth, command.structure)
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

              authentificationRepository.getConseillerByStructure
                .withArgs(command.idUtilisateurAuth, command.structure)
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
    })

    describe('Jeune', () => {
      describe("jeune venant de l'idp PASS_EMPLOI", async () => {
        describe('jeune connu', async () => {
          it('retourne le jeune', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.PASS_EMPLOI
            }

            const utilisateur = unUtilisateurConseiller()
            authentificationRepository.getJeuneByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
              .resolves(utilisateur)

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
        describe('jeune inconnu', async () => {
          it('retourne une erreur', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.PASS_EMPLOI
            }

            authentificationRepository.getJeuneByStructure
              .withArgs(command.idUtilisateurAuth, command.structure)
              .resolves(undefined)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(new NonTrouveError(command.idUtilisateurAuth))
            )
          })
        })
      })
      describe("jeune venant de l'idp MILO", async () => {
        describe("jeune connu par son id d'authentification", async () => {
          it('retourne le jeune quand', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.MILO
            }

            const utilisateur = unUtilisateurJeune({
              structure: Core.Structure.MILO
            })
            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              success({
                email: 'john.doe@plop.io',
                id: 'ABCDE',
                nom: 'Doe',
                prenom: 'John',
                roles: [],
                structure: 'MILO',
                type: 'JEUNE'
              })
            )
          })
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
            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(authentificationRepository.update).to.have.been.called()
            expect(isSuccess(result)).equal(true)
            if (isSuccess(result)) {
              expect(result.data.email).to.deep.equal('new@email.com')
            }
          })
          it("retourne une failure quand le jeune trouvé n'est pas Milo", async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              email: 'abc@test.com',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.MILO
            }

            const utilisateurPasMilo = unUtilisateurJeune({
              idAuthentification: command.idUtilisateurAuth,
              structure: Core.Structure.POLE_EMPLOI
            })
            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(utilisateurPasMilo)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTraitableError(
                  'Utilisateur',
                  command.idUtilisateurAuth,
                  'UTILISATEUR_NOUVEAU_PE'
                )
              )
            )
          })
        })

        describe("jeune non connu par son id d'authentification", async () => {
          it('retourne une failure', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              email: 'abc@test.com',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.MILO
            }

            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(undefined)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTraitableInexistantError(command.idUtilisateurAuth)
              )
            )
          })
        })
      })

      describe("jeune venant de l'idp Pole Emploi / BRSA", async () => {
        describe("jeune connu par son id d'authentification", async () => {
          it('retourne le jeune', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.POLE_EMPLOI
            }

            const utilisateur = unUtilisateurJeune({
              structure: Core.Structure.POLE_EMPLOI
            })
            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              success({
                email: 'john.doe@plop.io',
                id: 'ABCDE',
                nom: 'Doe',
                prenom: 'John',
                roles: [],
                structure: 'POLE_EMPLOI',
                type: 'JEUNE'
              })
            )
          })
          it("retourne une failure quand la structure du jeune trouvé n'est pas PE", async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.POLE_EMPLOI
            }

            const utilisateur = unUtilisateurJeune({
              structure: Core.Structure.POLE_EMPLOI_BRSA
            })
            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTraitableError(
                  'Utilisateur',
                  command.idUtilisateurAuth,
                  'UTILISATEUR_NOUVEAU_PE_BRSA'
                )
              )
            )
          })
        })
        describe('jeune connu par son email (première connexion)', async () => {
          it("retourne le jeune et enregistre l'id d'authentification + mise à jour date premiere connexion", async () => {
            // Given
            const utilisateur = unUtilisateurJeunePasConnecte({
              structure: Core.Structure.POLE_EMPLOI
            })

            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'Id connection',
              nom: 'nom jeune',
              prenom: 'prenom jeune',
              email: 'email jeune',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.POLE_EMPLOI
            }

            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(undefined)
            authentificationRepository.getJeuneByEmail
              .withArgs(command.email)
              .resolves(utilisateur)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              success({
                email: 'email jeune',
                id: 'ABCDE',
                nom: 'nom jeune',
                prenom: 'prenom jeune',
                roles: [],
                structure: 'POLE_EMPLOI',
                type: 'JEUNE'
              })
            )
            expect(
              authentificationRepository.update
            ).to.have.been.calledWithExactly({
              ...utilisateur,
              email: command.email,
              nom: command.nom,
              prenom: command.prenom,
              idAuthentification: command.idUtilisateurAuth,
              dateDerniereConnexion: uneDate(),
              datePremiereConnexion: uneDate()
            })
          })
          it('retourne une failure quand jeune trouvé pas de la bonne structure', async () => {
            // Given
            const utilisateurMauvaiseStructure = unUtilisateurJeune({
              structure: Core.Structure.MILO
            })

            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'Id connection',
              nom: 'nom jeune',
              prenom: 'prenom jeune',
              email: 'email jeune',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.POLE_EMPLOI
            }

            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(undefined)
            authentificationRepository.getJeuneByEmail
              .withArgs(command.email)
              .resolves(utilisateurMauvaiseStructure)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTraitableError(
                  'Utilisateur',
                  command.idUtilisateurAuth,
                  'UTILISATEUR_NOUVEAU_MILO'
                )
              )
            )
          })
        })
        describe("jeune non connu par son id d'authentification ou email", async () => {
          it("retourne une failure quand l'email PE n'est pas fournie", async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.POLE_EMPLOI,
              email: undefined
            }

            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(undefined)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTraitableError('Utilisateur', command.idUtilisateurAuth)
              )
            )
          })
          it('retourne une failure quand le jeune est pas trouvé', async () => {
            // Given
            const command: UpdateUtilisateurCommand = {
              idUtilisateurAuth: 'nilstavernier',
              email: 'abc@test.com',
              type: Authentification.Type.JEUNE,
              structure: Core.Structure.POLE_EMPLOI_BRSA
            }

            authentificationRepository.getJeune
              .withArgs(command.idUtilisateurAuth)
              .resolves(undefined)
            authentificationRepository.getJeuneByEmail
              .withArgs(command.email, command.structure)
              .resolves(undefined)

            // When
            const result = await updateUtilisateurCommandHandler.execute(
              command
            )

            // Then
            expect(result).to.deep.equal(
              failure(
                new NonTraitableInexistantError(command.idUtilisateurAuth)
              )
            )
          })
        })
      })
    })
  })
})
