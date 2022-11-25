import {
  GetIndicateursPourConseillerQuery,
  GetIndicateursPourConseillerQueryHandler
} from '../../../src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { expect, StubbedClass, stubClass } from '../../utils'
import { isSuccess } from '../../../src/building-blocks/types/result'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { Action } from '../../../src/domain/action/action'
import Statut = Action.Statut
import { DateTime } from 'luxon'
import { DateService } from '../../../src/utils/date-service'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { unEvenementEngagementDto } from '../../fixtures/sql-models/evenement-engagement.sql-model'
import { EvenementEngagementSqlModel } from '../../../src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { Evenement } from '../../../src/domain/evenement'
import { Authentification } from '../../../src/domain/authentification'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'

describe('GetIndicateursPourConseillerQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getIndicateursPourConseillerQueryHandler: GetIndicateursPourConseillerQueryHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'

  before(async () => {
    dateService = stubClass(DateService)
    getIndicateursPourConseillerQueryHandler =
      new GetIndicateursPourConseillerQueryHandler(
        dateService,
        conseillerAuthorizer
      )
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
          query
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
          query
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
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.terminees
        ).to.deep.equal(1)
      })

      it('récupère le nombre d’actions à échéance entre deux dates', async () => {
        // Given
        const dateEcheance = DateTime.fromISO('2022-03-06T03:24:00')

        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const actionAvecEcheanceDto = uneActionDto({
          idJeune,
          dateEcheance: dateEcheance.toJSDate(),
          statut: Statut.TERMINEE
        })

        const actionSansEcheanceSurIntervalleDto = uneActionDto({
          idJeune,
          statut: Statut.PAS_COMMENCEE
        })

        await ActionSqlModel.bulkCreate([
          actionAvecEcheanceDto,
          actionSansEcheanceSurIntervalleDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.actions.aEcheance
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
          query
        )

        // Then
        expect(
          isSuccess(response) && response.data.rendezVous.planifies
        ).to.deep.equal(2)
      })
    })

    describe('indicateurs offres', () => {
      let dateEvenement: Date
      let dateEvenementAvantDateDebut: Date
      let dateEvenementApresDateFin: Date

      beforeEach(() => {
        dateEvenement = new Date('2022-03-05T03:24:00')
        dateEvenementAvantDateDebut = new Date('2022-02-01T03:24:00')
        dateEvenementApresDateFin = new Date('2022-03-15T03:24:00')
      })
      it('récupère le nombre d’offres d’emploi consultées', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const engagementDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
          dateEvenement
        })
        const engagementAvantDateDebutDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
          dateEvenement: dateEvenementAvantDateDebut
        })
        const engagementApresDateFinDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
          dateEvenement: dateEvenementApresDateFin
        })
        await EvenementEngagementSqlModel.bulkCreate([
          engagementDto,
          engagementAvantDateDebutDto,
          engagementApresDateFinDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )
        // Then
        expect(
          isSuccess(response) && response.data.offres.consultees
        ).to.deep.equal(1)
      })
      it('récupère le nombre d’offres d’emploi partagées', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const engagementDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.MESSAGE_OFFRE_PARTAGEE,
          dateEvenement
        })
        const engagementAvantDateDebutDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.MESSAGE_OFFRE_PARTAGEE,
          dateEvenement: dateEvenementAvantDateDebut
        })
        const engagementApresDateFinDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.MESSAGE_OFFRE_PARTAGEE,
          dateEvenement: dateEvenementApresDateFin
        })

        await EvenementEngagementSqlModel.bulkCreate([
          engagementDto,
          engagementAvantDateDebutDto,
          engagementApresDateFinDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )
        // Then
        expect(
          isSuccess(response) && response.data.offres.partagees
        ).to.deep.equal(1)
      })
    })

    describe('indicateurs favoris', () => {
      let dateEvenement: Date
      let dateEvenementAvantDateDebut: Date
      let dateEvenementApresDateFin: Date

      beforeEach(() => {
        dateEvenement = new Date('2022-03-05T03:24:00')
        dateEvenementAvantDateDebut = new Date('2022-02-01T03:24:00')
        dateEvenementApresDateFin = new Date('2022-03-15T03:24:00')
      })

      it('récupère le nombre d’offres sauvegardée', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }

        const engagementDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE,
          dateEvenement
        })
        const engagementAvantDateDebutDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE,
          dateEvenement: dateEvenementAvantDateDebut
        })
        const engagementApresDateFinDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE,
          dateEvenement: dateEvenementApresDateFin
        })
        await EvenementEngagementSqlModel.bulkCreate([
          engagementDto,
          engagementAvantDateDebutDto,
          engagementApresDateFinDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )
        // Then
        expect(
          isSuccess(response) && response.data.favoris.offresSauvegardees
        ).to.deep.equal(1)
      })
      it('récupère le nombre de recherches sauvegardées', async () => {
        // Given
        const query: GetIndicateursPourConseillerQuery = {
          idConseiller,
          idJeune,
          dateDebut: dateDebut.toJSDate(),
          dateFin: dateFin.toJSDate()
        }
        const dateEvenement = new Date('2022-03-05T03:24:00')

        const engagementDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.RECHERCHE_IMMERSION_SAUVEGARDEE,
          dateEvenement
        })
        const engagementAvantDateDebutDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.RECHERCHE_IMMERSION_SAUVEGARDEE,
          dateEvenement: dateEvenementAvantDateDebut
        })
        const engagementApresDateFinDto = unEvenementEngagementDto({
          typeUtilisateur: Authentification.Type.JEUNE,
          idUtilisateur: idJeune,
          code: Evenement.Code.RECHERCHE_IMMERSION_SAUVEGARDEE,
          dateEvenement: dateEvenementApresDateFin
        })
        await EvenementEngagementSqlModel.bulkCreate([
          engagementDto,
          engagementAvantDateDebutDto,
          engagementApresDateFinDto
        ])

        // When
        const response = await getIndicateursPourConseillerQueryHandler.handle(
          query
        )
        // Then
        expect(
          isSuccess(response) && response.data.favoris.recherchesSauvegardees
        ).to.deep.equal(1)
      })
    })
  })
})
