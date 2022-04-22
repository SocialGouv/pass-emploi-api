import {StubbedType, stubInterface} from "@salesforce/ts-sinon";
import {Conseiller} from "../../../src/domain/conseiller";
import {Agence} from "../../../src/domain/agence";
import {ModifierConseillerCommandHandler} from "../../../src/application/queries/modifier-conseiller-command-handler.service";
import {createSandbox, expect} from "../../utils";
import {Failure} from "../../../src/building-blocks/types/result";
import {ErreurHttp} from "../../../src/building-blocks/types/domain-error";
import {Core} from "../../../src/domain/core";
import Structure = Core.Structure;
import {unUtilisateurConseiller, unUtilisateurJeune} from "../../fixtures/authentification.fixture";
import {Unauthorized} from "../../../src/domain/erreur";

describe('ModifierConseillerQueryHandler', () => {

    let conseillerRepository: StubbedType<Conseiller.Repository>
    let agencesRepository: StubbedType<Agence.Repository>
    let handler: ModifierConseillerCommandHandler

    const conseillerQuiExiste : Conseiller = {
        id: "id qui éxiste",
        firstName: "Jean michel",
        lastName: "Conseiller",
        structure: Structure.MILO,
        email: "mail@mail.mail",
        dateVerificationMessages: undefined,
        agence: undefined,
        nomAgenceManuel: undefined
    }

    const agenceQuiExiste : Agence = {
        id: "agence qui éxiste",
        nom: "Bonjour, je suis une agence"
    }

    beforeEach(() => {
      const sandbox = createSandbox()
      conseillerRepository = stubInterface(sandbox)
      agencesRepository = stubInterface(sandbox)

      handler = new ModifierConseillerCommandHandler(conseillerRepository, agencesRepository)
    })

    describe('handle', () => {
        describe("Quand le conseiller n'éxiste pas", () => {
            it('on doit avoir une erreur 404',  async () => {
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
                expect(result._isSuccess).to.be.false
                expect((result as Failure).error).to.deep.equal({
                    code: ErreurHttp.CODE,
                    statusCode: 404,
                    message: "le conseiller id qui n'éxiste pas n'éxiste pas"
                })
            });
        })

        describe("Quand l'agence n'éxiste pas", () => {
            it('on doit avoir une erreur 404',  async () => {
                // When
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        agence: {
                            id: "agence qui n'éxiste pas"
                        }
                    }
                }
                conseillerRepository.get
                    .withArgs("id qui éxiste")
                    .resolves(conseillerQuiExiste)
                agencesRepository.get
                    .withArgs("agence qui n'éxiste pas")
                    .resolves(undefined)

                // Given
                const result = await handler.handle(query)

                // Then
                expect(result._isSuccess).to.be.false
                expect((result as Failure).error).to.deep.equal({
                    code: ErreurHttp.CODE,
                    statusCode: 404,
                    message: "l'agence agence qui n'éxiste pas n'éxiste pas"
                })
            });
        })

        describe("Quand le conseiller et l'agence éxistent", () => {
            it('le conseiller est bien modifié', async function () {
                // Given
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        agence: {
                            id: "agence qui n'éxiste pas"
                        }
                    }
                }
                conseillerRepository.get
                    .withArgs("id qui éxiste")
                    .resolves(conseillerQuiExiste)
                agencesRepository.get
                    .withArgs("agence qui n'éxiste pas")
                    .resolves(agenceQuiExiste)

                // When
                const result = await handler.handle(query)

                // Then
                expect(result._isSuccess).to.be.true
            });
        })
    })

    describe('authorize', () => {
        describe("Quand on modifie l'id", () => {
            it("on reçoit une unauthorized", async () => {
                // Given
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        id: "Bonjour je suis un id"
                    }
                }

                // When
                const call = handler.execute(query, unUtilisateurConseiller())

                // Then
                await expect(call).to.be.rejectedWith(Unauthorized)
            })
        })

        describe("Quand on modifie le firstName", () => {
            it("on reçoit une unauthorized", async () => {
                // Given
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        firstName: "Jackie"
                    }
                }

                // When
                const call = handler.execute(query, unUtilisateurConseiller())

                // Then
                await expect(call).to.be.rejectedWith(Unauthorized)
            })
        })

        describe("Quand on modifie le lastName", () => {
            it("on reçoit une unauthorized", async () => {
                // Given
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        lastName: "Bla bla bla"
                    }
                }

                // When
                const call = handler.execute(query, unUtilisateurConseiller())

                // Then
                await expect(call).to.be.rejectedWith(Unauthorized)
            })
        })

        describe("Quand on est un jeune", () => {
            it("on reçoit une unauthorized", async () => {
                // Given
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        agence: {
                            id: "agence qui éxiste"
                        }
                    }
                }

                // When
                const call = handler.execute(query, unUtilisateurJeune())

                // Then
                await expect(call).to.be.rejectedWith(Unauthorized)
            })
        })

        describe("Quand on est un conseiller avec le mauvais id", () => {
            it("on reçoit une unauthorized", async () => {
                // Given
                const query = {
                    idConseiller: "id qui éxiste",
                    champsConseillerAModifier: {
                        agence: {
                            id: "agence qui éxiste"
                        }
                    }
                }

                // When
                const call = handler.execute(query, unUtilisateurConseiller())

                // Then
                await expect(call).to.be.rejectedWith(Unauthorized)
            })
        })
    })

    describe("Quand on est un conseiller avec le mauvais id", () => {
        it("on reçoit une unauthorized", async () => {
            // Given
            const query = {
                idConseiller: "id qui éxiste",
                champsConseillerAModifier: {
                    agence: {
                        id: "agence qui éxiste"
                    }
                }
            }

            // When
            const call = handler.execute(query, unUtilisateurConseiller({
                id: "id qui éxiste"
            }))

            // Then
            await expect(call).to.not.be.rejected
        })
    })
})