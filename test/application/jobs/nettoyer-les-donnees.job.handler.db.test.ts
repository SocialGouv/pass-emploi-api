import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { NettoyerLesDonneesJobHandler } from '../../../src/application/jobs/nettoyer-les-donnees.job.handler.db'
import { ArchiveJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/archive-jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../src/infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { getDatabase } from '../../utils/database-for-testing'
import { EvenementEngagementHebdoSqlModel } from '../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { Core } from '../../../src/domain/core'
import { SuiviJobSqlModel } from '../../../src/infrastructure/sequelize/models/suivi-job.sql-model'
import { Planificateur } from '../../../src/domain/planificateur'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { RendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import Source = RendezVous.Source

describe('NettoyerLesDonneesJobHandler', () => {
  let nettoyerLesDonneesJobHandler: NettoyerLesDonneesJobHandler
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let rendezVousDto: AsSql<RendezVousDto>
  let rendezVousDtoSansDateSuppression: AsSql<RendezVousDto>
  let rendezVousDtoMiloASupprimer: AsSql<RendezVousDto>
  let rendezVousDtoAvecUneDateRecente: AsSql<RendezVousDto>
  let rendezVousMiloAvantNettoyage: RendezVousSqlModel | null
  let rendezVousAvantNettoyage: RendezVousSqlModel | null

  before(async () => {
    await getDatabase().cleanPG()
    const sandbox: SinonSandbox = createSandbox()
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())
    suiviJobService = stubInterface(sandbox)

    nettoyerLesDonneesJobHandler = new NettoyerLesDonneesJobHandler(
      dateService,
      suiviJobService
    )

    // Given - Archive
    await ArchiveJeuneSqlModel.create({
      idJeune: 'idJeuneASupprimer',
      prenom: 'prenom',
      nom: 'nom',
      motif: 'motif',
      dateArchivage: uneDatetime().minus({ years: 2, day: 1 }).toJSDate(),
      donnees: { nom: 'nom' }
    })
    await ArchiveJeuneSqlModel.create({
      idJeune: 'idJeuneAGarder',
      prenom: 'prenom',
      nom: 'nom',
      motif: 'motif',
      dateArchivage: uneDatetime()
        .minus({ years: 2 })
        .plus({ day: 1 })
        .toJSDate(),
      donnees: { nom: 'nom' }
    })

    // Given - Log Api Partenaire
    await LogApiPartenaireSqlModel.create({
      id: 'a282ae5e-b1f0-4a03-86a3-1870d913da93',
      date: uneDatetime().minus({ months: 1, day: 1 }).toJSDate(),
      idUtilisateur: 'idUtilisateur',
      typeUtilisateur: 'typeUtilisateur',
      pathPartenaire: 'pathASupprimer',
      resultatPartenaire: { nom: 'nom' },
      resultat: { nom: 'nom' },
      transactionId: 'transactionId'
    })
    await LogApiPartenaireSqlModel.create({
      id: '826553e8-7581-44ab-9d76-f04be13f8971',
      date: uneDatetime().minus({ months: 1 }).plus({ day: 1 }).toJSDate(),
      idUtilisateur: 'idUtilisateur',
      typeUtilisateur: 'typeUtilisateur',
      pathPartenaire: 'pathAGarder',
      resultatPartenaire: { nom: 'nom' },
      resultat: { nom: 'nom' },
      transactionId: 'transactionId'
    })

    // Given - Evenement Engagement Hebdo
    await EvenementEngagementHebdoSqlModel.create({
      id: 1,
      dateEvenement: uneDatetime().minus({ week: 1, day: 1 }).toJSDate(),
      idUtilisateur: 'idUtilisateur',
      typeUtilisateur: 'typeUtilisateur',
      structure: Core.Structure.POLE_EMPLOI,
      categorie: 'aa',
      action: 'aa',
      nom: 'aa',
      code: 'aa'
    })
    await EvenementEngagementHebdoSqlModel.create({
      id: 2,
      dateEvenement: uneDatetime()
        .minus({ week: 1 })
        .plus({ day: 1 })
        .toJSDate(),
      idUtilisateur: 'idUtilisateur',
      typeUtilisateur: 'typeUtilisateur',
      structure: Core.Structure.POLE_EMPLOI,
      categorie: 'aa',
      action: 'aa',
      nom: 'aa',
      code: 'aa'
    })

    // Given - Suivi Job
    await SuiviJobSqlModel.create({
      id: 1,
      dateExecution: uneDatetime().minus({ days: 3 }).toJSDate(),
      jobType: Planificateur.JobType.NETTOYER_LES_DONNEES,
      succes: false,
      resultat: {},
      nbErreurs: 10,
      tempsExecution: 10
    })
    await SuiviJobSqlModel.create({
      id: 2,
      dateExecution: uneDatetime().minus({ days: 1 }).toJSDate(),
      jobType: Planificateur.JobType.NETTOYER_LES_DONNEES,
      succes: false,
      resultat: {},
      nbErreurs: 10,
      tempsExecution: 10
    })

    // Given - Rendez-vous
    rendezVousDto = unRendezVousDto({
      dateSuppression: uneDatetime().minus({ months: 7 }).toJSDate()
    })
    rendezVousDtoSansDateSuppression = unRendezVousDto({
      dateSuppression: null
    })
    await RendezVousSqlModel.create(rendezVousDto)
    await RendezVousSqlModel.create(rendezVousDtoSansDateSuppression)
    rendezVousAvantNettoyage = await RendezVousSqlModel.findByPk(
      rendezVousDto.id
    )
    // Given - Rendez-vous Milo
    rendezVousDtoMiloASupprimer = unRendezVousDto({
      date: uneDatetime().minus({ months: 7 }).toJSDate(),
      source: Source.MILO
    })
    rendezVousDtoAvecUneDateRecente = unRendezVousDto({
      date: uneDatetime().minus({ months: 1 }).toJSDate(),
      source: Source.MILO
    })
    await RendezVousSqlModel.create(rendezVousDtoMiloASupprimer)
    await RendezVousSqlModel.create(rendezVousDtoAvecUneDateRecente)
    rendezVousMiloAvantNettoyage = await RendezVousSqlModel.findByPk(
      rendezVousDtoMiloASupprimer.id
    )

    // When
    await nettoyerLesDonneesJobHandler.handle()
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
    it("supprime les logs de plus d'un mois", async () => {
      // Then
      const logs = await LogApiPartenaireSqlModel.findAll()
      expect(logs).to.have.length(1)
      expect(logs[0].pathPartenaire).to.equal('pathAGarder')
    })
  })

  describe("evenements d'engagement hebdo", () => {
    it("supprime les données de plus d'une semaine", async () => {
      // Then
      const events = await EvenementEngagementHebdoSqlModel.findAll()
      expect(events).to.have.length(1)
      expect(events[0].id).to.equal(2)
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
        await RendezVousSqlModel.findByPk(rendezVousDtoSansDateSuppression.id)
      expect(rendezVousAvantNettoyage).not.to.be.null()
      expect(rendezVousSansDateSuppressionApresNettoyage).not.to.be.null()
      expect(rendezVousApresNettoyage).to.be.null()
    })
  })
})