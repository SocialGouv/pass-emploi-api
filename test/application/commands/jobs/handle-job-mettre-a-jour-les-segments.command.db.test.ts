import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuiviJob } from 'src/domain/suivi-job'
import { DateService } from 'src/utils/date-service'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { HandleJobMettreAJourLesSegmentsCommandHandler } from '../../../../src/application/commands/jobs/handle-job-mettre-a-jour-les-segments.command'
import { BigqueryClient } from '../../../../src/infrastructure/clients/bigquery.client'
import { DatabaseForTesting } from '../../../utils/database-for-testing'
import * as fs from 'fs'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { Core } from '../../../../src/domain/core'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { CampagneSqlModel } from '../../../../src/infrastructure/sequelize/models/campagne.sql-model'
import {
  uneCampagne,
  uneEvaluationIncompleteDTO
} from '../../../fixtures/campagne.fixture'
import { ReponseCampagneSqlModel } from '../../../../src/infrastructure/sequelize/models/reponse-campagne.sql-model'
import { DateTime } from 'luxon'

describe('HandleJobMettreAJourLesSegmentsCommandHandler', () => {
  const database = DatabaseForTesting.prepare()

  let handleJobMettreAJourLesSegmentsCommandHandler: HandleJobMettreAJourLesSegmentsCommandHandler
  let bigqueryClient: StubbedClass<BigqueryClient>
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    bigqueryClient = stubClass(BigqueryClient)
    dateService.now.returns(uneDatetime())

    handleJobMettreAJourLesSegmentsCommandHandler =
      new HandleJobMettreAJourLesSegmentsCommandHandler(
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
      handleJobMettreAJourLesSegmentsCommandHandler.addOrSetSegment(
        segments,
        'key',
        'segment'
      )
      expect(segments.get('key')).to.deep.equal(['segment'])
    })

    it('ajoute le nouveau segment quand la clé existe', () => {
      segments.set('key', ['segment'])
      handleJobMettreAJourLesSegmentsCommandHandler.addOrSetSegment(
        segments,
        'key',
        'unAutreSegment'
      )
      expect(segments.get('key')).to.deep.equal(['segment', 'unAutreSegment'])
    })
  })

  describe('handle', () => {
    describe('des jeunes MILO/PE/PASS_EMPLOI et pas de campagne active', () => {
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
            id: 'j4',
            structure: Core.Structure.PASS_EMPLOI,
            instanceId: 'instanceId4'
          })
        )

        // When
        result = await handleJobMettreAJourLesSegmentsCommandHandler.handle()
      })
      it('retourne le suivi de job', async () => {
        // Then

        expect(result.succes).to.equal(true)
        expect(result.resultat).to.deep.equal({
          nbCampagnesNonRepondues: 0,
          nbJeunes: 4
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
    describe('des jeunes MILO/PE/PASS_EMPLOI et une campagne active', () => {
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
            id: 'j4',
            structure: Core.Structure.PASS_EMPLOI,
            instanceId: 'instanceId4'
          })
        )
        await CampagneSqlModel.create(
          uneCampagne({ dateFin: DateTime.now().plus({ years: 1 }) })
        )
        await ReponseCampagneSqlModel.create(
          uneEvaluationIncompleteDTO('idJeune', uneCampagne().id)
        )
        // When
        result = await handleJobMettreAJourLesSegmentsCommandHandler.handle()
      })
      it('retourne le suivi de job', async () => {
        // Then

        expect(result.succes).to.equal(true)
        expect(result.resultat).to.deep.equal({
          nbCampagnesNonRepondues: 3,
          nbJeunes: 4
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
          './test/fixtures/expected-files/memberships-avec-campagne.json'
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
})
