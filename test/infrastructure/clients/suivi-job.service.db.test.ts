import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { SuiviJobService } from 'src/infrastructure/clients/suivi-job.service.db'
import { Planificateur } from '../../../src/domain/planificateur'
import { RapportJob24h, SuiviJob } from '../../../src/domain/suivi-job'
import { SuiviJobSqlModel } from '../../../src/infrastructure/sequelize/models/suivi-job.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { testConfig } from '../../utils/module-for-testing'

describe('SuiviJobService', () => {
  DatabaseForTesting.prepare()
  let service: SuiviJobService
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    service = new SuiviJobService(configService, httpService)
  })

  describe('save', () => {
    it('insert en base une entrée de suivi de job', async () => {
      // Given
      const jobType = Planificateur.JobType.NETTOYER_LES_DONNEES
      const suiviJobNettoyage: SuiviJob = {
        jobType,
        dateExecution: uneDatetime(),
        nbErreurs: 0,
        succes: true,
        resultat: {},
        tempsExecution: 0
      }

      // When
      const jobsNettoyageAvantSave = await SuiviJobSqlModel.findAll({
        where: { jobType }
      })
      await service.save(suiviJobNettoyage)

      // Then
      const jobsNettoyageApresSave = await SuiviJobSqlModel.findAll({
        where: { jobType }
      })
      expect(jobsNettoyageAvantSave.length).to.equal(0)
      expect(jobsNettoyageApresSave.length).to.equal(1)
    })
  })
  describe('notifierResultatJob', () => {
    it('envoie une notif de succès quand le result est success', async () => {
      // Given
      const suivi: SuiviJob = {
        jobType: Planificateur.JobType.MAJ_AGENCE_AC,
        succes: true,
        dateExecution: uneDatetime(),
        tempsExecution: 0,
        nbErreurs: 0,
        resultat: { unChamp: 'present' }
      }
      const stringBody =
        '{"username":"CEJ Lama","text":"### Résultat du job _MAJ_AGENCE_AC_\\n| Statut | :white_check_mark: |\\n    |:------------------------|:------------|\\n    | jobType | MAJ_AGENCE_AC |\\n| succes | true |\\n| dateExecution | 2020-04-06T14:00:00.000+02:00 |\\n| tempsExecution | 0 |\\n| nbErreurs | 0 |\\n| unChamp | present |"}'

      const scope = nock(configService.get('mattermost').jobWebhookUrl)
        .post('', stringBody)
        .reply(200)

      // When
      await service.notifierResultatJob(suivi)

      // Then
      expect(scope.isDone()).to.equal(true)
    })
    it("envoie une notif d'erreur quand le result est error", async () => {
      // Given
      const suivi: SuiviJob = {
        jobType: Planificateur.JobType.MAJ_AGENCE_AC,
        succes: false,
        dateExecution: uneDatetime(),
        tempsExecution: 0,
        nbErreurs: 0,
        resultat: new NonTrouveError('test', '1')
      }
      const heureParis = uneDatetime().setZone('Europe/Paris').toISO()
      const stringBody = `{"username":"CEJ Lama","text":"### Résultat du job _MAJ_AGENCE_AC_\\n| Statut | :x: |\\n    |:------------------------|:------------|\\n    | jobType | MAJ_AGENCE_AC |\\n| succes | false |\\n| dateExecution | ${heureParis} |\\n| tempsExecution | 0 |\\n| nbErreurs | 0 |\\n| code | NON_TROUVE |\\n| message | test 1 non trouvé(e) |"}`

      const scope = nock(configService.get('mattermost').jobWebhookUrl)
        .post('', stringBody)
        .reply(200)

      // When
      await service.notifierResultatJob(suivi)

      // Then
      expect(scope.isDone()).to.equal(true)
    })
  })
  describe('envoyerRapport', () => {
    it('envoie un rapport des jobs', async () => {
      // Given
      const rapport: RapportJob24h[] = [
        {
          jobType: Planificateur.JobType.NETTOYER_LES_DONNEES,
          nbExecutionsAttendues: 3,
          nbExecutions: 2,
          nbErreurs: 1,
          nbEchecs: 0,
          datesExecutions: [uneDatetime(), uneDatetime()]
        }
      ]
      const heureParis = uneDatetime().setZone('Europe/Paris').toISO()
      const stringBody = `{"username":"CEJ Lama","text":"### Rapport quotidien des CRONs\\n|jobType|nbExecutionsAttendues|nbExecutions|nbErreurs|nbEchecs|datesExecutions|aBienTourne|pasEnEchec\\n|:---|:---|:---|:---|:---|:---|:---|:---\\n|NETTOYER_LES_DONNEES|3|2|1|0|${heureParis}, ${heureParis}|:x:|:white_check_mark:|"}`

      const scope = nock(configService.get('mattermost').jobWebhookUrl)
        .post('', stringBody)
        .reply(200)

      // When
      await service.envoyerRapport(rapport)

      // Then
      expect(scope.isDone()).to.equal(true)
    })
  })
})