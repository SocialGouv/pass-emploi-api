import {
  ChangerAgenceCommand,
  ChangerAgenceCommandHandler
} from '../../../src/application/commands/changer-agence.command.handler'
import {
  unUtilisateurConseiller,
  unUtilisateurSupport
} from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../../src/building-blocks/types/result'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Agence } from '../../../src/domain/agence'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { createSandbox } from 'sinon'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { uneAgence } from '../../fixtures/agence.fixture'
import { AnimationCollective } from '../../../src/domain/rendez-vous/animation-collective'
import {
  uneAnimationCollective,
  unJeuneDuRendezVous
} from '../../fixtures/rendez-vous.fixture'
import { DateService } from '../../../src/utils/date-service'
import { ChangementAgenceQueryModel } from '../../../src/application/queries/query-models/changement-agence.query-model'

describe('ChangerAgenceCommandHandler', () => {
  let changerAgenceCommandHandler: ChangerAgenceCommandHandler
  let agenceRepository: StubbedType<Agence.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let animationCollectiveRepository: StubbedType<AnimationCollective.Repository>
  let animationCollectiveService: AnimationCollective.Service
  let dateService: StubbedClass<DateService>

  const conseiller = unConseiller({
    agence: {
      id: 'id-agence-actuelle',
      nom: 'agence actuelle'
    }
  })

  const unAutreConseiller = unConseiller({
    id: 'un-autre-conseiller',
    agence: {
      id: 'id-agence-actuelle',
      nom: 'agence actuelle'
    }
  })

  const jeuneDuConseiller = unJeuneDuRendezVous({
    id: 'id-jeune-du-conseiller',
    conseiller: {
      id: conseiller.id,
      lastName: conseiller.lastName,
      firstName: conseiller.firstName,
      idAgence: conseiller.agence!.id
    }
  })

  const jeuneDunAutreConseiller = unJeuneDuRendezVous({
    id: 'id-jeune-autre-conseiller',
    conseiller: {
      id: unAutreConseiller.id,
      firstName: unAutreConseiller.firstName,
      lastName: unAutreConseiller.lastName,
      idAgence: unAutreConseiller.agence!.id
    }
  })

  const agenceCible = uneAgence({
    id: 'idAgenceCible'
  })

  const command: ChangerAgenceCommand = {
    idConseiller: conseiller.id,
    idAgenceCible: 'idAgenceCible'
  }

  beforeEach(async () => {
    const sandbox = createSandbox()
    agenceRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    animationCollectiveRepository = stubInterface(sandbox)
    dateService = stubClass(DateService)
    animationCollectiveService = new AnimationCollective.Service(
      animationCollectiveRepository,
      dateService
    )
    changerAgenceCommandHandler = new ChangerAgenceCommandHandler(
      conseillerRepository,
      agenceRepository,
      animationCollectiveRepository,
      animationCollectiveService
    )
  })

  describe('handle', () => {
    describe("quand le conseiller n'existe pas", () => {
      it('rejette', async () => {
        // Given
        conseillerRepository.get.withArgs(conseiller.id).resolves(undefined)

        // When
        const result = await changerAgenceCommandHandler.handle(command)

        // Then
        expect(isFailure(result)).to.equal(true)
      })
    })
    describe("quand l'agence cible n'existe pas", () => {
      it('rejette', async () => {
        // Given
        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)
        agenceRepository.get
          .withArgs(command.idAgenceCible, conseiller.structure)
          .resolves(undefined)

        // When
        const result = await changerAgenceCommandHandler.handle(command)

        // Then
        expect(isFailure(result)).to.equal(true)
      })
    })
    describe("quand l'agence cible est la même", () => {
      it('rejette', async () => {
        // Given
        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)
        agenceRepository.get
          .withArgs(conseiller.agence!.id, conseiller.structure)
          .resolves(conseiller.agence)

        // When
        const result = await changerAgenceCommandHandler.handle({
          idConseiller: conseiller.id,
          idAgenceCible: conseiller.agence!.id!
        })

        // Then
        expect(isFailure(result)).to.equal(true)
      })
    })
    describe("quand le conseiller n'a pas de jeune et n'a pas créé d'AC", () => {
      it("change l'agence cible", async () => {
        // Given
        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)
        agenceRepository.get
          .withArgs(command.idAgenceCible, conseiller.structure)
          .resolves(agenceCible)
        animationCollectiveRepository.getAllNonClosesParEtablissement.resolves(
          []
        )

        // When
        const result = await changerAgenceCommandHandler.handle(command)

        // Then
        expect(conseillerRepository.save).to.have.been.calledWithExactly({
          ...conseiller,
          agence: agenceCible
        })
        expect(result).to.deep.equal(success([]))
      })
    })
    describe('quand le conseiller a au moins un jeune', () => {
      beforeEach(() => {
        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)
        agenceRepository.get
          .withArgs(command.idAgenceCible, conseiller.structure)
          .resolves(agenceCible)
      })
      describe("quand il y a des AC non closes dans l'établissement", () => {
        describe("quand le conseiller a créé l'AC", () => {
          describe("quand tous les jeunes de l'AC sont au conseiller", () => {
            const animationCollective = uneAnimationCollective({
              idAgence: conseiller.agence!.id!,
              jeunes: [jeuneDuConseiller],
              createur: {
                id: conseiller.id,
                nom: conseiller.lastName,
                prenom: conseiller.firstName
              }
            })
            let result: Result<ChangementAgenceQueryModel[]>
            beforeEach(async () => {
              // Given
              animationCollectiveRepository.getAllNonClosesParEtablissement
                .withArgs(conseiller.agence!.id)
                .resolves([animationCollective])

              // When
              result = await changerAgenceCommandHandler.handle(command)
            })
            it("modifie l'agence cible de l'AC", () => {
              expect(
                animationCollectiveRepository.save
              ).to.have.been.calledWithExactly({
                ...animationCollective,
                idAgence: agenceCible.id
              })
            })
            it("modifie l'agence cible du conseiller", () => {
              expect(conseillerRepository.save).to.have.been.calledWithExactly({
                ...conseiller,
                agence: agenceCible
              })
            })
            it('renvoie un succès', () => {
              // Then
              const expected: ChangementAgenceQueryModel = {
                idAncienneAgence: 'id-agence-actuelle',
                idAnimationCollective: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
                idNouvelleAgence: 'idAgenceCible',
                jeunesDesinscrits: [],
                titreAnimationCollective: 'rdv'
              }
              expect(result).to.deep.equal(success([expected]))
            })
          })
          describe("quand un des jeunes de l'AC n'est pas au conseiller", () => {
            const animationCollective = uneAnimationCollective({
              idAgence: conseiller.agence!.id!,
              jeunes: [jeuneDuConseiller, jeuneDunAutreConseiller],
              createur: {
                id: conseiller.id,
                nom: conseiller.lastName,
                prenom: conseiller.firstName
              }
            })
            let result: Result<ChangementAgenceQueryModel[]>
            beforeEach(async () => {
              // Given
              animationCollectiveRepository.getAllNonClosesParEtablissement
                .withArgs(conseiller.agence!.id)
                .resolves([animationCollective])

              // When
              result = await changerAgenceCommandHandler.handle(command)
            })
            it('désinscrit les autres jeunes', () => {
              expect(
                animationCollectiveRepository.save
              ).to.have.been.calledWithExactly({
                ...animationCollective,
                jeunes: [jeuneDuConseiller]
              })
            })
            it("modifie l'agence cible du conseiller", () => {
              it("modifie l'agence cible du conseiller", () => {
                expect(
                  conseillerRepository.save
                ).to.have.been.calledWithExactly({
                  ...conseiller,
                  agence: agenceCible
                })
              })
            })
            it('renvoie un succès', () => {
              // Then
              const expected: ChangementAgenceQueryModel = {
                idAncienneAgence: 'id-agence-actuelle',
                idAnimationCollective: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
                idNouvelleAgence: 'idAgenceCible',
                jeunesDesinscrits: [
                  {
                    id: 'id-jeune-autre-conseiller',
                    nom: 'Doe',
                    prenom: 'John'
                  }
                ],
                titreAnimationCollective: 'rdv'
              }
              expect(result).to.deep.equal(success([expected]))
            })
          })
        })

        describe("quand le conseiller n'a pas créé l'AC", () => {
          const animationCollective = uneAnimationCollective({
            idAgence: unAutreConseiller.agence!.id!,
            jeunes: [jeuneDuConseiller, jeuneDunAutreConseiller],
            createur: {
              id: unAutreConseiller.id,
              nom: unAutreConseiller.lastName,
              prenom: unAutreConseiller.firstName
            }
          })
          let result: Result<ChangementAgenceQueryModel[]>
          beforeEach(async () => {
            // Given
            animationCollectiveRepository.getAllNonClosesParEtablissement
              .withArgs(conseiller.agence!.id)
              .resolves([animationCollective])

            // When
            result = await changerAgenceCommandHandler.handle(command)
          })
          it('désinscrit ses jeunes', () => {
            expect(
              animationCollectiveRepository.save
            ).to.have.been.calledWithExactly({
              ...animationCollective,
              jeunes: [jeuneDunAutreConseiller]
            })
          })
          it("modifie l'agence cible du conseiller", () => {
            it("modifie l'agence cible du conseiller", () => {
              expect(conseillerRepository.save).to.have.been.calledWithExactly({
                ...conseiller,
                agence: agenceCible
              })
            })
          })
          it('renvoie un succès', () => {
            // Then
            const expected: ChangementAgenceQueryModel = {
              idAncienneAgence: 'id-agence-actuelle',
              idAnimationCollective: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
              idNouvelleAgence: 'id-agence-actuelle',
              jeunesDesinscrits: [
                {
                  id: 'id-jeune-du-conseiller',
                  nom: 'Doe',
                  prenom: 'John'
                }
              ],
              titreAnimationCollective: 'rdv'
            }
            expect(result).to.deep.equal(success([expected]))
          })
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise le support', async () => {
      // When
      const result = await changerAgenceCommandHandler.authorize(
        command,
        unUtilisateurSupport()
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('rejette les autres', async () => {
      // When
      const result = await changerAgenceCommandHandler.authorize(
        command,
        unUtilisateurConseiller()
      )

      // Then
      expect(isFailure(result)).to.be.true()
    })
  })
})
