import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { DateService } from '../../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { HandleJobNettoyerLesDonneesCommandHandler } from '../../../../src/application/commands/jobs/handle-job-nettoyer-les-donnees.command.db'
import { DatabaseForTesting } from '../../../utils/database-for-testing'
import { ArchiveJeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/archive-jeune.sql-model'
import { LogApiPartenaireSqlModel } from '../../../../src/infrastructure/sequelize/models/log-api-partenaire.sql-model'

describe('HandleJobNettoyerLesDonneesCommandHandler', () => {
  DatabaseForTesting.prepare()
  let handleJobNettoyerLesDonneesCommandHandler: HandleJobNettoyerLesDonneesCommandHandler
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(() => {
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
    it('supprime les archives de plus de 2 ans', async () => {
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
})
