import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Op } from 'sequelize'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { NettoyerLesDonneesJobHandler } from '../../../src/application/jobs/nettoyer-les-donnees.job.handler.db'
import { Planificateur } from '../../../src/domain/planificateur'
import {
  CodeTypeRendezVous,
  RendezVous,
  TYPES_ANIMATIONS_COLLECTIVES
} from '../../../src/domain/rendez-vous/rendez-vous'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ArchiveJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/archive-jeune.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../src/infrastructure/sequelize/models/log-api-partenaire.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { SuiviJobSqlModel } from '../../../src/infrastructure/sequelize/models/suivi-job.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { DateService } from '../../../src/utils/date-service'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import Source = RendezVous.Source
import { Chat } from '../../../src/domain/chat'
import { Authentification } from '../../../src/domain/authentification'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from '../../fixtures/sql-models/favoris.sql-model'
import { NotificationJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/notification-jeune.sql-model'

let stats: SuiviJob

const idJeuneAUpdateSonConseillerInitial = 'push1'
const idJeune2 = 'push2'
const idJeune3 = 'push3'
const maintenant = uneDatetime()

describe('NettoyerLesDonneesJobHandler', () => {
  let nettoyerLesDonneesJobHandler: NettoyerLesDonneesJobHandler
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let rendezVousDto: AsSql<RendezVousDto>
  let rendezVousDtoAGarder: AsSql<RendezVousDto>
  let rendezVousDtoMiloASupprimer: AsSql<RendezVousDto>
  let rendezVousDtoAvecUneDateRecente: AsSql<RendezVousDto>
  let rendezVousMiloAvantNettoyage: RendezVousSqlModel | null
  let rendezVousAvantNettoyage: RendezVousSqlModel | null
  let animationsCollectivesFutureSansInscrit: AsSql<RendezVousDto>
  let animationsCollectivesPasseesAvecInscrits: AsSql<RendezVousDto>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let chatRepository: StubbedType<Chat.Repository>

  before(async () => {
    const databaseForTesting = getDatabase()
    await databaseForTesting.cleanPG()

    const sandbox: SinonSandbox = createSandbox()
    dateService = stubClass(DateService)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    suiviJobService = stubInterface(sandbox)
    authentificationRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)

    nettoyerLesDonneesJobHandler = new NettoyerLesDonneesJobHandler(
      dateService,
      suiviJobService,
      databaseForTesting.sequelize,
      authentificationRepository,
      chatRepository
    )

    // Given - Conseillers
    await ConseillerSqlModel.bulkCreate([
      unConseillerDto({
        id: 'con1',
        dateDerniereConnexion: maintenant.minus({ years: 2, day: 2 }).toJSDate()
      }),
      unConseillerDto({
        id: 'con2',
        dateDerniereConnexion: maintenant.minus({ days: 10 }).toJSDate()
      })
    ])
    // Given - Jeunes
    await JeuneSqlModel.bulkCreate([
      unJeuneDto({
        id: 'idJeuneASupprimer',
        idConseiller: 'con1',
        dateDerniereConnexion: maintenant.minus({ years: 2, day: 2 }).toJSDate()
      }),
      unJeuneDto({
        id: 'idJeuneASupprimerConseillerEstInactif',
        dateDerniereConnexion: maintenant.minus({ days: 10 }).toJSDate(),
        idConseiller: 'con1'
      }),
      unJeuneDto({
        id: idJeuneAUpdateSonConseillerInitial,
        dateDerniereConnexion: maintenant.minus({ days: 10 }).toJSDate(),
        idConseiller: 'con2',
        idConseillerInitial: 'con1'
      }),
      unJeuneDto({
        id: idJeune2,
        dateDerniereConnexion: maintenant.minus({ days: 59 }).toJSDate(),
        idConseiller: undefined
      }),
      unJeuneDto({
        id: idJeune3,
        dateDerniereConnexion: maintenant.minus({ days: 62 }).toJSDate(),
        idConseiller: undefined
      })
    ])
    // Given - Archive
    await ArchiveJeuneSqlModel.create({
      idJeune: 'idJeuneAArchiver',
      prenom: 'prenom',
      nom: 'nom',
      motif: 'motif',
      dateArchivage: maintenant.minus({ years: 2, day: 1 }).toJSDate(),
      donnees: { nom: 'nom' }
    })
    await ArchiveJeuneSqlModel.create({
      idJeune: 'idJeuneAGarder',
      prenom: 'prenom',
      nom: 'nom',
      motif: 'motif',
      dateArchivage: maintenant.minus({ years: 2 }).plus({ day: 1 }).toJSDate(),
      donnees: { nom: 'nom' }
    })

    // Given - Log Api Partenaire
    await LogApiPartenaireSqlModel.create({
      id: 'a282ae5e-b1f0-4a03-86a3-1870d913da93',
      date: maintenant.minus({ week: 2, day: 1 }).toJSDate(),
      idUtilisateur: 'idUtilisateur',
      typeUtilisateur: 'typeUtilisateur',
      pathPartenaire: 'pathASupprimer',
      resultatPartenaire: { nom: 'nom' },
      resultat: { nom: 'nom' },
      transactionId: 'transactionId'
    })
    await LogApiPartenaireSqlModel.create({
      id: '826553e8-7581-44ab-9d76-f04be13f8971',
      date: maintenant.minus({ week: 2 }).plus({ day: 1 }).toJSDate(),
      idUtilisateur: 'idUtilisateur',
      typeUtilisateur: 'typeUtilisateur',
      pathPartenaire: 'pathAGarder',
      resultatPartenaire: { nom: 'nom' },
      resultat: { nom: 'nom' },
      transactionId: 'transactionId'
    })

    // Given - Suivi Job
    await SuiviJobSqlModel.create({
      id: 1,
      dateExecution: maintenant.minus({ days: 3 }).toJSDate(),
      jobType: Planificateur.JobType.NETTOYER_LES_DONNEES,
      succes: false,
      resultat: {},
      nbErreurs: 10,
      tempsExecution: 10
    })
    await SuiviJobSqlModel.create({
      id: 2,
      dateExecution: maintenant.minus({ days: 1 }).toJSDate(),
      jobType: Planificateur.JobType.NETTOYER_LES_DONNEES,
      succes: false,
      resultat: {},
      nbErreurs: 10,
      tempsExecution: 10
    })
    await NotificationJeuneSqlModel.create({
      id: 'notifAGarder',
      idJeune: idJeune2,
      dateNotif: maintenant.minus({ days: 1 }).toJSDate(),
      type: 'TEST',
      titre: 'test',
      description: 'test',
      idObjet: null
    })
    await NotificationJeuneSqlModel.create({
      id: 'notifASupprimer',
      idJeune: idJeune2,
      dateNotif: maintenant.minus({ days: 10 }).toJSDate(),
      type: 'TEST',
      titre: 'test',
      description: 'test',
      idObjet: null
    })

    // Given - Rendez-vous
    rendezVousDto = unRendezVousDto({
      date: maintenant.minus({ years: 2 }).toJSDate()
    })
    rendezVousDtoAGarder = unRendezVousDto({
      date: maintenant.minus({ years: 2 }).plus({ days: 1 }).toJSDate()
    })
    await RendezVousSqlModel.create(rendezVousDto)
    await RendezVousSqlModel.create(rendezVousDtoAGarder)
    rendezVousAvantNettoyage = await RendezVousSqlModel.findByPk(
      rendezVousDto.id
    )
    // Given - Rendez-vous Milo
    rendezVousDtoMiloASupprimer = unRendezVousDto({
      date: maintenant.minus({ months: 7 }).toJSDate(),
      source: Source.MILO
    })
    rendezVousDtoAvecUneDateRecente = unRendezVousDto({
      date: maintenant.minus({ months: 1 }).toJSDate(),
      source: Source.MILO
    })
    await RendezVousSqlModel.create(rendezVousDtoMiloASupprimer)
    await RendezVousSqlModel.create(rendezVousDtoAvecUneDateRecente)
    rendezVousMiloAvantNettoyage = await RendezVousSqlModel.findByPk(
      rendezVousDtoMiloASupprimer.id
    )

    // Given - Actions
    await ActionSqlModel.bulkCreate([
      uneActionDto({
        idJeune: idJeuneAUpdateSonConseillerInitial,
        dateEcheance: maintenant.minus({ years: 2, days: 1 }).toJSDate()
      }),
      uneActionDto({
        idJeune: idJeuneAUpdateSonConseillerInitial,
        dateEcheance: maintenant
          .minus({ years: 2 })
          .plus({ days: 1 })
          .toJSDate()
      })
    ])

    // Given - Animations collectives
    const animationsCollectivesPasseesSansInscrit = unRendezVousDto({
      date: maintenant.minus({ day: 1 }).toJSDate(),
      type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
    })
    animationsCollectivesFutureSansInscrit = unRendezVousDto({
      date: maintenant.plus({ day: 1 }).toJSDate(),
      type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
    })
    animationsCollectivesPasseesAvecInscrits = unRendezVousDto({
      date: maintenant.minus({ day: 1 }).toJSDate(),
      type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
    })
    await RendezVousSqlModel.bulkCreate([
      animationsCollectivesPasseesSansInscrit,
      animationsCollectivesFutureSansInscrit,
      animationsCollectivesPasseesAvecInscrits
    ])
    await RendezVousJeuneAssociationSqlModel.create({
      idJeune: idJeuneAUpdateSonConseillerInitial,
      idRendezVous: animationsCollectivesPasseesAvecInscrits.id
    })
    await FavoriOffreEmploiSqlModel.bulkCreate([
      unFavoriOffreEmploi({
        idJeune: idJeune2,
        dateCreation: maintenant.minus({ month: 3 }).toJSDate()
      }),
      unFavoriOffreEmploi({
        id: 2,
        idJeune: idJeune2,
        dateCreation: maintenant.minus({ month: 6 }).toJSDate()
      })
    ])
    await FavoriOffreEngagementSqlModel.bulkCreate([
      unFavoriOffreEngagement({
        idJeune: idJeune2,
        id: 2,
        dateCreation: maintenant.minus({ month: 3 }).toJSDate()
      }),
      unFavoriOffreEngagement({
        idJeune: idJeune2,
        dateCreation: maintenant.minus({ month: 6 }).toJSDate()
      })
    ])
    await FavoriOffreImmersionSqlModel.bulkCreate([
      unFavoriOffreImmersion({
        idJeune: idJeune2,
        id: 2,
        dateCreation: maintenant.minus({ month: 3 }).toJSDate()
      }),
      unFavoriOffreImmersion({
        idJeune: idJeune2,
        dateCreation: maintenant.minus({ month: 6 }).toJSDate()
      })
    ])

    // When
    stats = await nettoyerLesDonneesJobHandler.handle()
  })

  describe('jeunes', () => {
    it('supprime les jeunes de plus de 2 ans', async () => {
      // Then
      const jeunes = await JeuneSqlModel.findAll()
      expect(
        (stats.resultat as { nombreJeunesSupprimes: number })
          .nombreJeunesSupprimes
      ).to.equal(1)
      expect(jeunes).to.have.length(3)
      expect(jeunes[1].id).to.equal(idJeuneAUpdateSonConseillerInitial)
      expect(jeunes[0].id).to.equal(idJeune2)
      expect(jeunes[2].id).to.equal(idJeune3)
    })
  })

  describe('conseillers', () => {
    it('supprime les conseillers de plus de 2 ans', async () => {
      // Then
      const conseillers = await ConseillerSqlModel.findAll()
      const jeune = await JeuneSqlModel.findByPk(
        idJeuneAUpdateSonConseillerInitial
      )
      expect(
        (
          stats.resultat as {
            nombreConseillersSupprimes: number
          }
        ).nombreConseillersSupprimes
      ).to.equal(1)
      expect(
        (
          stats.resultat as {
            nombreJeunesSupprimesConseillerInactif: number
          }
        ).nombreJeunesSupprimesConseillerInactif
      ).to.equal(1)
      expect(conseillers.length).to.equal(1)
      expect(conseillers[0].id).to.equal('con2')
      expect(jeune?.idConseillerInitial).to.be.null()
    })
  })

  describe('archives', () => {
    it('supprime les archives de plus de 2 ans', async () => {
      // Then
      const archives = await ArchiveJeuneSqlModel.findAll()
      expect(archives).to.have.length(1)
      expect(archives[0].idJeune).to.equal('idJeuneAGarder')
    })
  })

  describe('logs api partenaires', () => {
    it('supprime les logs de plus de deux semaines', async () => {
      // Then
      const logs = await LogApiPartenaireSqlModel.findAll()
      expect(logs).to.have.length(1)
      expect(logs[0].pathPartenaire).to.equal('pathAGarder')
    })
  })

  describe('suivi jobs', () => {
    it('supprime les données de plus de deux jours', async () => {
      // Then
      const suivi = await SuiviJobSqlModel.findAll()
      expect(suivi).to.have.length(1)
      expect(suivi[0].id).to.equal(2)
    })
  })

  describe('rendez-vous supprimés', () => {
    it('supprime les rendez-vous passés il y à plus de 3 mois et source = MILO', async () => {
      // Then
      const rendezVousApresNettoyage = await RendezVousSqlModel.findByPk(
        rendezVousDtoMiloASupprimer.id
      )
      const rendezVousAvecDateRecenteApresNettoyage =
        await RendezVousSqlModel.findByPk(rendezVousDtoAvecUneDateRecente.id)
      expect(rendezVousMiloAvantNettoyage).not.to.be.null()
      expect(rendezVousAvecDateRecenteApresNettoyage).not.to.be.null()
      expect(rendezVousApresNettoyage).to.be.null()
    })

    it('supprime les rendez-vous archivés de plus de six mois', async () => {
      // Then
      const rendezVousApresNettoyage = await RendezVousSqlModel.findByPk(
        rendezVousDto.id
      )
      const rendezVousSansDateSuppressionApresNettoyage =
        await RendezVousSqlModel.findByPk(rendezVousDtoAGarder.id)
      expect(rendezVousAvantNettoyage).not.to.be.null()
      expect(rendezVousSansDateSuppressionApresNettoyage).not.to.be.null()
      expect(rendezVousApresNettoyage).to.be.null()
    })
  })

  describe('jeune', () => {
    it('met à null pushToken pour jeunes connectés la denière fois il y a plus de 60 jours', async () => {
      // Then
      const jeunes = await JeuneSqlModel.findAll()
      expect(jeunes).to.have.length(3)
      expect(jeunes[1].id).to.equal(idJeuneAUpdateSonConseillerInitial)
      expect(jeunes[1].pushNotificationToken).to.equal('token')
      expect(jeunes[0].id).to.equal(idJeune2)
      expect(jeunes[0].pushNotificationToken).to.equal('token')
      expect(jeunes[2].id).to.equal(idJeune3)
      expect(jeunes[2].pushNotificationToken).to.equal(null)
    })
  })

  describe('actions', () => {
    it('supprime les action arrivées à échance il y a plus de 2 ans', async () => {
      // Then
      const actionsApresNettoyage = await ActionSqlModel.findAll()
      expect(actionsApresNettoyage.length).to.equal(1)
    })
  })

  describe('favoris emploi', () => {
    it('supprime les favoris emploi de plus de 6 mois', async () => {
      // Then
      const favorisEmploiApresNettoyage =
        await FavoriOffreEmploiSqlModel.findAll()
      expect(favorisEmploiApresNettoyage.length).to.equal(1)
      expect(
        (stats.resultat as { nombreFavrisEmploiSupprimes: number })
          .nombreFavrisEmploiSupprimes
      ).to.equal(1)
    })
  })

  describe('favoris Engagement', () => {
    it('supprime les favoris Engagement de plus de 6 mois', async () => {
      // Then
      const favorisEngagementApresNettoyage =
        await FavoriOffreEngagementSqlModel.findAll()
      expect(favorisEngagementApresNettoyage.length).to.equal(1)
      expect(
        (stats.resultat as { nombreFavrisEngagementSupprimes: number })
          .nombreFavrisEngagementSupprimes
      ).to.equal(1)
    })
  })

  describe('favoris Immersion', () => {
    it('supprime les favoris Immersion de plus de 6 mois', async () => {
      // Then
      const favorisImmersionApresNettoyage =
        await FavoriOffreImmersionSqlModel.findAll()
      expect(favorisImmersionApresNettoyage.length).to.equal(1)
      expect(
        (stats.resultat as { nombreFavrisImmersionSupprimes: number })
          .nombreFavrisImmersionSupprimes
      ).to.equal(1)
    })
  })

  describe('notifs', () => {
    it('supprime les notifs de plus de 8 jours', async () => {
      // Then
      const notifsApresNettoyage = await NotificationJeuneSqlModel.findAll()
      expect(notifsApresNettoyage.length).to.equal(1)
      expect(
        (stats.resultat as { nombreNotificationsJeuneSupprimes: number })
          .nombreNotificationsJeuneSupprimes
      ).to.equal(1)
    })
  })

  describe('animations collectives', () => {
    it('clôt les animations collectives passées sans incrit', async () => {
      const animationsApresNettoyage = await RendezVousSqlModel.findAll({
        where: {
          dateCloture: null,
          type: {
            [Op.in]: TYPES_ANIMATIONS_COLLECTIVES
          }
        }
      })

      expect(animationsApresNettoyage.map(({ id }) => id)).to.deep.equal(
        [
          animationsCollectivesFutureSansInscrit,
          animationsCollectivesPasseesAvecInscrits
        ].map(({ id }) => id)
      )
    })
  })
})
