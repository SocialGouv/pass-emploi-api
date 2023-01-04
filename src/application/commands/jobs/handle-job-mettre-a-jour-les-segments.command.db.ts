import { Inject, Injectable } from '@nestjs/common'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { QueryTypes, Sequelize } from 'sequelize'
import { BigqueryClient } from '../../../infrastructure/clients/bigquery.client'
import { JobHandler } from '../../../building-blocks/types/job-handler'
import { Job } from 'bull'
import { Planificateur, ProcessJobType } from '../../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../../domain/suivi-job'
import { DateService } from '../../../utils/date-service'
import { createWriteStream } from 'fs'
import { Core } from '../../../domain/core'
import { DateTime } from 'luxon'

const membershipsFile = './tmp/memberships.json'
const metadataFile = './tmp/metadata.json'
const datasetId = 'firebase_imported_segments'
const NEW_LINE = '\n'

interface RawJeune {
  instance_id: string
  structure: Core.Structure
}

enum SEGMENTS {
  CAMPAGNE_NON_REPONDUE = 'CAMPAGNE_NON_REPONDUE',
  JEUNES_MILO = 'JEUNES_MILO',
  JEUNES_POLE_EMPLOI = 'JEUNES_POLE_EMPLOI',
  JEUNES_PASS_EMPLOI = 'JEUNES_PASS_EMPLOI'
}

@Injectable()
@ProcessJobType(Planificateur.JobType.MAJ_SEGMENTS)
export class HandleJobMettreAJourLesSegmentsCommandHandler extends JobHandler<Job> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService,
    private bigqueryClient: BigqueryClient
  ) {
    super(Planificateur.JobType.MAJ_SEGMENTS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const nbErreurs = 0
    const maintenant = this.dateService.now()
    try {
      this.writeMetadata()

      const segments: Map<string, string[]> = new Map<string, string[]>()
      const nbJeunes = await this.handleSegmentJeunes(segments)
      const nbCampagnesNonRepondues =
        await this.handleSegmentCampagneNonRepondue(segments)

      this.writeMemberships(segments, maintenant)
      await this.bigqueryClient.loadData(
        datasetId,
        'SegmentMetadata',
        metadataFile
      )
      await this.bigqueryClient.loadData(
        datasetId,
        'SegmentMemberships',
        membershipsFile
      )
      return {
        jobType: this.jobType,
        nbErreurs,
        succes: true,
        dateExecution: maintenant,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        resultat: { nbJeunes, nbCampagnesNonRepondues }
      }
    } catch (e) {
      this.logger.error(e)
      return {
        jobType: this.jobType,
        nbErreurs,
        succes: false,
        dateExecution: maintenant,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        resultat: {}
      }
    }
  }

  async fetchJeunesInstanceIdNayantPasReponduAUneCampagneActive(): Promise<
    RawJeune[]
  > {
    const sqlCampagneEnCours = `select id
                                    from campagne
                                    where date_debut < now()
                                      and date_fin > now()`
    const campagnesEnCours = (await this.sequelize.query(sqlCampagneEnCours, {
      type: QueryTypes.SELECT
    })) as object[]
    if (!campagnesEnCours.length) {
      return []
    }

    const sql = `select instance_id, structure
                     from jeune
                     where instance_id is not null
                       and id not in (select id_jeune
                                      from reponse_campagne
                                      where id_campagne in
                                            (select id from campagne where date_debut < now() and date_fin > now()))`
    return (await this.sequelize.query(sql, {
      type: QueryTypes.SELECT
    })) as RawJeune[]
  }

  async fetchJeunes(): Promise<RawJeune[]> {
    const sql = `select instance_id, structure
                     from jeune
                     where instance_id is not null`
    return (await this.sequelize.query(sql, {
      type: QueryTypes.SELECT
    })) as RawJeune[]
  }

  writeMetadata(): void {
    const metadataWriteStream = createWriteStream(metadataFile)
    const metadatas = [
      {
        segment_label: SEGMENTS.CAMPAGNE_NON_REPONDUE,
        display_name: 'Campagne non répondue'
      },
      {
        segment_label: SEGMENTS.JEUNES_MILO,
        display_name: 'Jeunes MILO'
      },
      {
        segment_label: SEGMENTS.JEUNES_POLE_EMPLOI,
        display_name: 'Jeunes POLE EMPLOI'
      },
      {
        segment_label: SEGMENTS.JEUNES_PASS_EMPLOI,
        display_name: 'Jeunes PASS EMPLOI'
      }
    ]
    metadatas.forEach(metadata => {
      metadataWriteStream.write(JSON.stringify(metadata) + NEW_LINE)
    })
    metadataWriteStream.end()
  }

  writeMemberships(
    segments: Map<string, string[]>,
    maintenant: DateTime
  ): void {
    const membershipsWriteStream = createWriteStream(membershipsFile)
    for (const [key, value] of segments) {
      const segment = {
        instance_id: key,
        update_time: maintenant.toJSDate(),
        segment_labels: value
      }
      membershipsWriteStream.write(JSON.stringify(segment) + NEW_LINE)
    }

    membershipsWriteStream.end()
  }

  async handleSegmentJeunes(segments: Map<string, string[]>): Promise<number> {
    const jeunes: RawJeune[] = await this.fetchJeunes()
    jeunes.forEach(jeune => {
      const segment = this.buildSegmentJeune(jeune.structure)
      segments.set(jeune.instance_id, [segment])
    })
    return jeunes.length
  }

  private buildSegmentJeune(structure: Core.Structure): SEGMENTS {
    switch (structure) {
      case Core.Structure.POLE_EMPLOI:
        return SEGMENTS.JEUNES_POLE_EMPLOI
      case Core.Structure.MILO:
        return SEGMENTS.JEUNES_MILO
      case Core.Structure.PASS_EMPLOI:
        return SEGMENTS.JEUNES_PASS_EMPLOI
    }
    throw new Error(`Unknown structure ${structure}`)
  }

  async handleSegmentCampagneNonRepondue(
    segments: Map<string, string[]>
  ): Promise<number> {
    const jeunes: RawJeune[] =
      await this.fetchJeunesInstanceIdNayantPasReponduAUneCampagneActive()
    jeunes.forEach(jeune => {
      this.addOrSetSegment(
        segments,
        jeune.instance_id,
        SEGMENTS.CAMPAGNE_NON_REPONDUE
      )
    })
    return jeunes.length
  }

  addOrSetSegment(
    segments: Map<string, string[]>,
    instanceId: string,
    segmentUser: string
  ): void {
    const segment = segments.get(instanceId)
    if (segment) {
      segment.push(segmentUser)
      segments.set(instanceId, segment)
    } else {
      segments.set(instanceId, [segmentUser])
    }
  }
}
