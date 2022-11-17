import { GetAnimationsCollectivesQueryHandler } from '../../../src/application/queries/get-animations-collectives.query.handler.db'
import { ConseillerEtablissementAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-etablissement'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unEtablissementDto } from '../../fixtures/sql-models/etablissement.sq-model'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { isSuccess, success } from '../../../src/building-blocks/types/result'
import { DateService } from '../../../src/utils/date-service'

describe('GetAnimationsCollectivesQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getAnimationsCollectivesQueryHandler: GetAnimationsCollectivesQueryHandler
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerEtablissementAuthorizer>
  let dateService: StubbedClass<DateService>

  const maintenant = uneDatetime()
  const agenceDto = unEtablissementDto()
  const conseillerDto = unConseillerDto({
    idAgence: agenceDto.id
  })

  beforeEach(() => {
    dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    conseillerAgenceAuthorizer = stubClass(ConseillerEtablissementAuthorizer)
    getAnimationsCollectivesQueryHandler =
      new GetAnimationsCollectivesQueryHandler(
        conseillerAgenceAuthorizer,
        dateService
      )
  })

  describe('handle', () => {
    beforeEach(async () => {
      await AgenceSqlModel.create(agenceDto)

      await ConseillerSqlModel.creer(conseillerDto)
    })

    describe("quand il n'y a pas d'animation collective", () => {
      it('renvoie un tableau vide', async () => {
        // Given
        const unRendezVousIndividuel = unRendezVousDto({
          date: maintenant.toJSDate(),
          type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
          createur: {
            id: conseillerDto.id,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom
          },
          idAgence: agenceDto.id
        })

        await RendezVousSqlModel.create(unRendezVousIndividuel)

        // When
        const animationsCollectives =
          await getAnimationsCollectivesQueryHandler.handle({
            idEtablissement: agenceDto.id
          })

        // Then
        expect(animationsCollectives).to.deep.equal(success([]))
      })
    })

    describe('quand il y a une animation collective', () => {
      describe("quand elle n'est pas dans la période", () => {
        it('renvoie un tableau vide', async () => {
          // Given
          const uneAnimationCollective = unRendezVousDto({
            date: maintenant.toJSDate(),
            type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
            createur: {
              id: conseillerDto.id,
              nom: conseillerDto.nom,
              prenom: conseillerDto.prenom
            },
            idAgence: agenceDto.id
          })

          await RendezVousSqlModel.create(uneAnimationCollective)

          // When
          const animationsCollectives =
            await getAnimationsCollectivesQueryHandler.handle({
              idEtablissement: agenceDto.id,
              dateDebut: maintenant.plus({ days: 1 }),
              dateFin: maintenant.plus({ days: 2 })
            })

          // Then
          expect(animationsCollectives).to.deep.equal(success([]))
        })
      })
      describe('quand elle est dans la période', () => {
        describe('quand le rendez vous est futur et non cloturé', () => {
          it("renvoie l'animation collective avec le statut à venir", async () => {
            // Given
            const uneAnimationCollective = unRendezVousDto({
              date: maintenant.plus({ day: 5 }).toJSDate(),
              dateCloture: null,
              type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
              createur: {
                id: conseillerDto.id,
                nom: conseillerDto.nom,
                prenom: conseillerDto.prenom
              },
              idAgence: agenceDto.id
            })

            await RendezVousSqlModel.create(uneAnimationCollective)

            // When
            const result = await getAnimationsCollectivesQueryHandler.handle({
              idEtablissement: agenceDto.id
            })

            // Then
            expect(isSuccess(result) && result.data.length).to.equal(1)
            expect(isSuccess(result) && result.data[0].statut).to.equal(
              RendezVous.AnimationCollective.Statut.A_VENIR
            )
          })
        })
        describe('quand le rendez vous est passé et cloturé', () => {
          it("renvoie l'animation collective avec le statut cloturée", async () => {
            // Given
            const uneAnimationCollective = unRendezVousDto({
              date: maintenant.minus({ day: 5 }).toJSDate(),
              dateCloture: maintenant.minus({ day: 1 }).toJSDate(),
              type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
              createur: {
                id: conseillerDto.id,
                nom: conseillerDto.nom,
                prenom: conseillerDto.prenom
              },
              idAgence: agenceDto.id
            })

            await RendezVousSqlModel.create(uneAnimationCollective)

            // When
            const result = await getAnimationsCollectivesQueryHandler.handle({
              idEtablissement: agenceDto.id
            })

            // Then
            expect(isSuccess(result) && result.data.length).to.equal(1)
            expect(isSuccess(result) && result.data[0].statut).to.equal(
              RendezVous.AnimationCollective.Statut.CLOTUREE
            )
          })
        })
        describe('quand le rendez vous est passé et non cloturé', () => {
          it("renvoie l'animation collective avec le à cloturer", async () => {
            // Given
            const uneAnimationCollective = unRendezVousDto({
              date: maintenant.minus({ day: 5 }).toJSDate(),
              dateCloture: null,
              type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
              createur: {
                id: conseillerDto.id,
                nom: conseillerDto.nom,
                prenom: conseillerDto.prenom
              },
              idAgence: agenceDto.id
            })

            await RendezVousSqlModel.create(uneAnimationCollective)

            // When
            const result = await getAnimationsCollectivesQueryHandler.handle({
              idEtablissement: agenceDto.id
            })

            // Then
            expect(isSuccess(result) && result.data.length).to.equal(1)
            expect(isSuccess(result) && result.data[0].statut).to.equal(
              RendezVous.AnimationCollective.Statut.A_CLOTURER
            )
          })
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller sur son établissement', () => {
      // Whem
      getAnimationsCollectivesQueryHandler.authorize(
        { idEtablissement: 'paris' },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerAgenceAuthorizer.authorize
      ).to.have.been.calledWithExactly('paris', unUtilisateurConseiller())
    })
  })
})
