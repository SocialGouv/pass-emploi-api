import { Campagne } from '../../src/domain/campagne'
import { expect, StubbedClass, stubClass } from '../utils'
import { IdService } from '../../src/utils/id-service'
import { failure, success } from '../../src/building-blocks/types/result'
import {
  CampagneNonActive,
  NonTrouveError,
  ReponsesCampagneInvalide
} from '../../src/building-blocks/types/domain-error'
import { uneCampagne } from '../fixtures/campagne.fixture'
import { DateService } from '../../src/utils/date-service'
import { DateTime } from 'luxon'
import { unJeune } from '../fixtures/jeune.fixture'

describe('Campagne', () => {
  const idCampagne = '1cd43a45-0dc5-4530-9e02-38a48e352c5f'
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
  const jeune = unJeune()

  let campagneFactory: Campagne.Factory
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    idService = stubClass(IdService)
    idService.uuid.returns(idCampagne)

    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)

    campagneFactory = new Campagne.Factory(idService, dateService)
  })

  describe('evaluer', () => {
    describe('quand la campagne est absente', () => {
      it('rejette', () => {
        // Given
        const reponses: Campagne.Reponse[] = [
          {
            idReponse: 1,
            idQuestion: 1
          }
        ]

        // When
        const evaluation = campagneFactory.construireEvaluation(
          undefined,
          jeune,
          reponses
        )

        // Then
        expect(evaluation).to.be.deep.equal(
          failure(new NonTrouveError('Campagne'))
        )
      })
    })
    describe('quand la campagne est présente', () => {
      describe("quand elle n'est pas en cours", () => {
        it('rejette', () => {
          // Given
          const reponses: Campagne.Reponse[] = [
            {
              idReponse: 1,
              idQuestion: 1
            }
          ]

          const campagnePassee = uneCampagne({
            dateDebut: maintenant.minus({ week: 5 }),
            dateFin: maintenant.minus({ week: 3 })
          })

          // When
          const evaluation = campagneFactory.construireEvaluation(
            campagnePassee,
            jeune,
            reponses
          )

          // Then
          expect(evaluation).to.be.deep.equal(
            failure(new CampagneNonActive(campagnePassee.nom))
          )
        })
      })
      describe('quand elle est en cours', () => {
        const campagneEnCours = uneCampagne({
          dateDebut: maintenant.minus({ week: 1 }),
          dateFin: maintenant.plus({ week: 1 })
        })

        describe('quand les réponses sont valides', () => {
          it('retourne une évaluation', () => {
            // Given
            const reponsesValides: Campagne.Reponse[] = [
              {
                idReponse: 1,
                idQuestion: 1
              }
            ]

            // When
            const evaluation = campagneFactory.construireEvaluation(
              campagneEnCours,
              jeune,
              reponsesValides
            )

            // Then
            const expected: Campagne.Evaluation = {
              idCampagne: campagneEnCours.id,
              jeune: {
                id: jeune.id,
                dateCreation: jeune.creationDate,
                structure: jeune.structure
              },
              reponses: reponsesValides,
              date: maintenant
            }
            expect(evaluation).to.be.deep.equal(success(expected))
          })
        })
        describe('quand il manque la réponse à la première question', () => {
          it('rejette', () => {
            // Given
            const reponsesInvalides: Campagne.Reponse[] = [
              {
                idReponse: 2,
                idQuestion: 2
              }
            ]

            // When
            const evaluation = campagneFactory.construireEvaluation(
              campagneEnCours,
              jeune,
              reponsesInvalides
            )

            // Then
            expect(evaluation).to.be.deep.equal(
              failure(new ReponsesCampagneInvalide())
            )
          })
        })
      })
    })
  })
})
