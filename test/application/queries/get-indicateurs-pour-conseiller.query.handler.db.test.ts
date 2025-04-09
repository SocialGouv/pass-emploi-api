import { DateTime } from 'luxon'
import { Core } from 'src/domain/core'
import { FavoriOffreEmploiSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from 'src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { uneDate } from 'test/fixtures/date.fixture'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from 'test/fixtures/sql-models/favoris.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import {
  GetIndicateursPourConseillerQuery,
  GetIndicateursPourConseillerQueryHandler
} from '../../../src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { isSuccess } from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action/action'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import Statut = Action.Statut

describe('GetIndicateursPourConseillerQueryHandler', () => {
  let getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let dateService: StubbedClass<DateService>
  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'
  const utilisateur = unUtilisateurConseiller({
    structure: Core.Structure.MILO
  })

  before(async () => {
    dateService = stubClass(DateService)
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    getIndicateursPourConseillerQueryHandler =
      new GetIndicateursPourConseillerQueryHandler(
        dateService,
        conseillerAgenceAuthorizer
      )
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  describe('handle', () => {
    beforeEach(async () => {
      const conseillerDto = unConseillerDto({ id: idConseiller })
      await ConseillerSqlModel.creer(conseillerDto)
      const jeuneDto = unJeuneDto({ id: idJeune, idConseiller })
      await JeuneSqlModel.creer(jeuneDto)
    })

    const dateDebut = DateTime.fromISO('2022-03-01T03:24:00')
    const dateFin = DateTime.fromISO('2022-03-08T03:24:00')

    describe('indicateurs actions', () => {
      it('récupère le nombre d’actions créées entre deux dates', async () => {
        // Given
        const dateCreation = DateTime.fromISO('2022-03-05T03:24:00')

        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const actionDto = uneActionDto({
          dateCreation: dateCreation.toJSDate(),
          idJeune
        })
        const actionAvantDateDebutDto = uneActionDto({
          dateCreation: dateDebut.minus({ days: 1 }).toJSDate(),
          idJeune
        })
        const actionApresDateFinDto = uneActionDto({
          dateCreation: dateFin.plus({ days: 1 }).toJSDate(),
          idJeune
        })
        await ActionSqlModel.bulkCreate([
          actionDto,
          actionAvantDateDebutDto,
          actionApresDateFinDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query,
          utilisateur
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.creees
        ).to.deep.equal(1)
      })

      it('récupère le nombre d’actions en retard entre deux dates', async () => {
        // Given
        const dateDuJour = DateTime.fromISO('2022-03-07T03:24:00')
        dateService.nowJs.returns(dateDuJour.toJSDate())
        const dateEcheanceUnJourAvantDateDuJour = dateDuJour.minus({ days: 1 })
        const dateEcheanceUnJourApresDateDuJour = dateDuJour.plus({ days: 1 })

        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const actionPasCommenceeEnRetardDto = uneActionDto({
          idJeune,
          dateEcheance: dateEcheanceUnJourAvantDateDuJour.toJSDate(),
          statut: Statut.PAS_COMMENCEE
        })
        const actionPasCommenceeNonEnRetardDto = uneActionDto({
          idJeune,
          dateEcheance: dateEcheanceUnJourApresDateDuJour.toJSDate(),
          statut: Statut.PAS_COMMENCEE
        })
        const actionTermineeDto = uneActionDto({
          idJeune,
          dateEcheance: dateEcheanceUnJourAvantDateDuJour.toJSDate(),
          statut: Statut.TERMINEE
        })
        await ActionSqlModel.bulkCreate([
          actionPasCommenceeEnRetardDto,
          actionPasCommenceeNonEnRetardDto,
          actionTermineeDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query,
          utilisateur
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.enRetard
        ).to.deep.equal(1)
      })

      it('récupère le nombre d’actions terminées entre deux dates', async () => {
        // Given
        const dateFinReelleDansLaPeriode = DateTime.fromISO(
          '2022-03-06T03:24:00'
        )
        const dateFinReelleUnJourAvantDateDebut = dateDebut.minus({ days: 1 })
        const dateFinReelleUnJourApresDateFin = dateFin.plus({ days: 1 })

        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const actionTermineeDansLaPeriodeDto = uneActionDto({
          idJeune,
          dateFinReelle: dateFinReelleDansLaPeriode.toJSDate(),
          statut: Statut.TERMINEE
        })
        const actionTermineeAvantLaDateDebutDto = uneActionDto({
          idJeune,
          dateFinReelle: dateFinReelleUnJourAvantDateDebut.toJSDate(),
          statut: Statut.TERMINEE
        })
        const actionTermineeApresLaDateFinDto = uneActionDto({
          idJeune,
          dateFinReelle: dateFinReelleUnJourApresDateFin.toJSDate(),
          statut: Statut.TERMINEE
        })

        const actionPasCommenceeDto = uneActionDto({
          idJeune,
          statut: Statut.PAS_COMMENCEE
        })

        await ActionSqlModel.bulkCreate([
          actionTermineeDansLaPeriodeDto,
          actionTermineeAvantLaDateDebutDto,
          actionTermineeApresLaDateFinDto,
          actionPasCommenceeDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query,
          utilisateur
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.terminees
        ).to.deep.equal(1)
      })
    })

    describe('indicateurs rendez-vous', () => {
      it('récupère le nombre de rendez-vous planifiés entre des dates', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const rendezVousAvantDto = unRendezVousDto({
          date: dateDebut.minus({ days: 1 }).toJSDate()
        })

        const rendezVousApresDto = unRendezVousDto({
          date: dateFin.plus({ days: 1 }).toJSDate()
        })

        const rendezVousDebutDto = unRendezVousDto({
          date: dateDebut.toJSDate()
        })
        const rendezVousFinDto = unRendezVousDto({
          date: dateFin.toJSDate()
        })

        await RendezVousSqlModel.bulkCreate([
          rendezVousAvantDto,
          rendezVousApresDto,
          rendezVousDebutDto,
          rendezVousFinDto
        ])

        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          { idJeune, idRendezVous: rendezVousAvantDto.id },
          { idJeune, idRendezVous: rendezVousApresDto.id },
          { idJeune, idRendezVous: rendezVousDebutDto.id },
          { idJeune, idRendezVous: rendezVousFinDto.id }
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query,
          utilisateur
        )

        // Then
        expect(
          isSuccess(response) && response.data.rendezVous.planifies
        ).to.deep.equal(2)
      })
    })

    describe('indicateurs favoris', () => {
      // Given
      it('récupère le nombre d’offres sauvegardées et postulées', async () => {
        const datePendantPeriode = dateDebut.plus({ day: 1 }).toJSDate()
        const dateAvantPeriode = dateDebut.minus({ day: 1 }).toJSDate()
        const dateApresPeriode = dateFin.plus({ day: 1 }).toJSDate()

        await FavoriOffreEmploiSqlModel.bulkCreate([
          unFavoriOffreEmploi({
            id: 1,
            idJeune,
            idOffre: 'id-offre-emploi-1',
            dateCreation: datePendantPeriode
          }),
          unFavoriOffreEmploi({
            id: 2,
            idJeune,
            idOffre: 'id-offre-emploi-2',
            dateCreation: dateAvantPeriode,
            dateCandidature: dateApresPeriode
          })
        ])
        await FavoriOffreEngagementSqlModel.bulkCreate([
          unFavoriOffreEngagement({
            id: 3,
            idJeune,
            idOffre: 'id-offre-engagement-3',
            dateCreation: dateAvantPeriode
          }),
          unFavoriOffreEngagement({
            id: 4,
            idJeune,
            idOffre: 'id-offre-engagement-4',
            dateCreation: dateAvantPeriode,
            dateCandidature: datePendantPeriode
          })
        ])
        await FavoriOffreImmersionSqlModel.bulkCreate([
          unFavoriOffreImmersion({
            id: 5,
            idJeune,
            idOffre: 'id-offre-immersion-5',
            dateCreation: dateApresPeriode
          }),
          unFavoriOffreImmersion({
            id: 6,
            idJeune,
            idOffre: 'id-offre-immersion-6',
            dateCreation: datePendantPeriode,
            dateCandidature: datePendantPeriode
          })
        ])

        // When
        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query,
          utilisateur
        )
        // Then
        expect(
          isSuccess(response) && response.data.offres.sauvegardees
        ).to.deep.equal(2)
        expect(
          isSuccess(response) && response.data.offres.postulees
        ).to.deep.equal(2)
      })
    })
  })

  describe('authorize', () => {
    describe("quand c'est un conseiller", () => {
      it('valide le conseiller', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idJeune: 'id-jeune',
          idConseiller: 'id-conseiller',
          dateDebut: uneDate(),
          dateFin: uneDate()
        }

        // When
        await getIndicateursPourConseillerQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
        ).to.have.been.calledWithExactly('id-jeune', utilisateur)
      })
    })
  })
})
