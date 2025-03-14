import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import * as fs from 'fs'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { DateService } from 'src/utils/date-service'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { MajSegmentsJobHandler } from '../../../src/application/jobs/maj-segments.job.handler.db'
import { Core } from '../../../src/domain/core'
import { BigqueryClient } from '../../../src/infrastructure/clients/bigquery.client'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'

describe('MajSegmentsJobHandler', () => {
  let database: DatabaseForTesting

  before(async () => {
    database = getDatabase()
  })

  let majSegmentsJobHandler: MajSegmentsJobHandler
  let bigqueryClient: StubbedClass<BigqueryClient>
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(async () => {
    await database.cleanPG()
    const sandbox: SinonSandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    bigqueryClient = stubClass(BigqueryClient)
    dateService.now.returns(uneDatetime())

    majSegmentsJobHandler = new MajSegmentsJobHandler(
      database.sequelize,
      suiviJobService,
      dateService,
      bigqueryClient
    )
  })
  describe('.addOrSetSegment', () => {
    let segments: Map<string, string[]>
    beforeEach(() => {
      segments = new Map<string, string[]>()
    })
    it("crée un nouveau segment quand la clé n'existe pas", () => {
      majSegmentsJobHandler.addOrSetSegment(segments, 'key', 'segment')
      expect(segments.get('key')).to.deep.equal(['segment'])
    })

    it('ajoute le nouveau segment quand la clé existe', () => {
      segments.set('key', ['segment'])
      majSegmentsJobHandler.addOrSetSegment(segments, 'key', 'unAutreSegment')
      expect(segments.get('key')).to.deep.equal(['segment', 'unAutreSegment'])
    })
  })

  describe('handle', () => {
    let result: SuiviJob
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto())
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'idJeune',
          structure: Core.Structure.MILO,
          instanceId: 'instanceId'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'j2',
          structure: Core.Structure.MILO,
          instanceId: 'instanceId2'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'j3',
          structure: Core.Structure.POLE_EMPLOI,
          instanceId: 'instanceId3'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'j5',
          structure: Core.Structure.POLE_EMPLOI_BRSA,
          instanceId: 'instanceId5'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'j6',
          structure: Core.Structure.POLE_EMPLOI_AIJ,
          instanceId: 'instanceId6'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'j7',
          structure: Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF,
          instanceId: 'instanceId7'
        })
      )

      // When
      result = await majSegmentsJobHandler.handle()
    })

    it('retourne le suivi de job', async () => {
      // Then

      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({
        nbJeunes: 6
      })
    })

    it('construit le fichier metadata', async () => {
      // Then
      const expectedMetadataFile = fs.readFileSync(
        './test/fixtures/expected-files/metadata.json'
      )
      const resultMetadataFile = fs.readFileSync('./tmp/metadata.json')
      expect(resultMetadataFile.toString()).to.equal(
        expectedMetadataFile.toString()
      )
    })

    it('construit le fichier memberships', async () => {
      // Then
      const expectedMembershipsFile = fs.readFileSync(
        './test/fixtures/expected-files/memberships.json'
      )
      const resultMembershipsFile = fs.readFileSync('./tmp/memberships.json')
      expect(resultMembershipsFile.toString()).to.equal(
        expectedMembershipsFile.toString()
      )
    })

    it('envoie les 2 fichiers à bigquery', async () => {
      // Then
      expect(bigqueryClient.loadData).to.have.been.calledWith(
        'firebase_imported_segments',
        'SegmentMetadata',
        './tmp/metadata.json'
      )
      expect(bigqueryClient.loadData).to.have.been.calledWith(
        'firebase_imported_segments',
        'SegmentMemberships',
        './tmp/memberships.json'
      )
    })
  })
})
