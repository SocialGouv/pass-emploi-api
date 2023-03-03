import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { HandleJobNettoyerLesDonneesCommandHandler } from '../../../src/application/cron-jobs/handle-job-nettoyer-les-donnees.command.db'
import { ArchiveJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/archive-jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../src/infrastructure/sequelize/models/log-api-partenaire.sql-model'
import { getDatabase } from '../../utils/database-for-testing'
import { EvenementEngagementHebdoSqlModel } from '../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { Core } from '../../../src/domain/core'
import { SuiviJobSqlModel } from '../../../src/infrastructure/sequelize/models/suivi-job.sql-model'
import { Planificateur } from '../../../src/domain/planificateur'

describe('HandleJobNettoyerLesDonneesCommandHandler', () => {
  let handleJobNettoyerLesDonneesCommandHandler: HandleJobNettoyerLesDonneesCommandHandler
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(async () => {
    await getDatabase().cleanPG()
    const sandbox: SinonSandbox = createSandbox()
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime())
    suiviJobService = stubInterface(sandbox)

    handleJobNettoyerLesDonneesCommandHandler =
      new HandleJobNettoyerLesDonneesCommandHandler(dateSevice, suiviJobService)
  })

  describe('archives', () => {
    it('supprime les archives de plus de 2 ans', async () => {
      // Given
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

      // When
      await handleJobNettoyerLesDonneesCommandHandler.handle()

      // Then
      const archives = await ArchiveJeuneSqlModel.findAll()
      expect(archives).to.have.length(1)
      expect(archives[0].idJeune).to.equal('idJeuneAGarder')
    })
  })

  describe('logs api partenaires', () => {
    it("supprime les logs de plus d'un mois", async () => {
      // Given
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

      // When
      await handleJobNettoyerLesDonneesCommandHandler.handle()

      // Then
      const logs = await LogApiPartenaireSqlModel.findAll()
      expect(logs).to.have.length(1)
      expect(logs[0].pathPartenaire).to.equal('pathAGarder')
    })
  })

  describe("evenements d'engagement hebdo", () => {
    it("supprime les données de plus d'une semaine", async () => {
      // Given
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

      // When
      await handleJobNettoyerLesDonneesCommandHandler.handle()

      // Then
      const events = await EvenementEngagementHebdoSqlModel.findAll()
      expect(events).to.have.length(1)
      expect(events[0].id).to.equal(2)
    })
  })

  describe('suivi jobs', () => {
    it('supprime les données de plus de deux jours', async () => {
      // Given
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

      // When
      await handleJobNettoyerLesDonneesCommandHandler.handle()

      // Then
      const suivi = await SuiviJobSqlModel.findAll()
      expect(suivi).to.have.length(1)
      expect(suivi[0].id).to.equal(2)
    })
  })
})
