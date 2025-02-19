import { Inject, Injectable } from '@nestjs/common'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { QueryTypes, Sequelize } from 'sequelize'
import { BigqueryClient } from '../../infrastructure/clients/bigquery.client'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Job } from 'bull'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { DateService } from '../../utils/date-service'
import { createWriteStream } from 'fs'
import { Core } from '../../domain/core'
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
  JEUNES_MILO = 'JEUNES_MILO',
  JEUNES_POLE_EMPLOI = 'JEUNES_POLE_EMPLOI',
  JEUNES_POLE_EMPLOI_BRSA = 'JEUNES_POLE_EMPLOI_BRSA',
  JEUNES_POLE_EMPLOI_AIJ = 'JEUNES_POLE_EMPLOI_AIJ',
  JEUNES_POLE_EMPLOI_CD = 'JEUNES_POLE_EMPLOI_CD',
  JEUNES_POLE_EMPLOI_AVENIR_PRO = 'JEUNES_POLE_EMPLOI_AVENIR_PRO',
  BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_INTENSIF = 'BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_INTENSIF',
  BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_GLOBAL = 'BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_GLOBAL',
  BENEFICIAIRES_FRANCE_TRAVAIL_EQUIP_EMPLOI_RECRUT = 'BENEFICIAIRES_FRANCE_TRAVAIL_EQUIP_EMPLOI_RECRUT'
}

@Injectable()
@ProcessJobType(Planificateur.JobType.MAJ_SEGMENTS)
export class MajSegmentsJobHandler extends JobHandler<Job> {
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
        resultat: { nbJeunes }
      }
    } catch (e) {
      this.logger.error(e)
      return {
        jobType: this.jobType,
        nbErreurs,
        succes: false,
        dateExecution: maintenant,
        tempsExecution: DateService.calculerTempsExecution(maintenant),
        resultat: {},
        erreur: e
      }
    }
  }

  async fetchJeunes(): Promise<RawJeune[]> {
    const sql = `select instance_id, structure
                     from jeune
                     where instance_id is not null`
    return this.sequelize.query(sql, {
      type: QueryTypes.SELECT
    })
  }

  writeMetadata(): void {
    const metadataWriteStream = createWriteStream(metadataFile)
    const metadatas: { [key in SEGMENTS]: string } = {
      [SEGMENTS.JEUNES_MILO]: 'Jeunes MILO',
      [SEGMENTS.JEUNES_POLE_EMPLOI]: 'Jeunes POLE EMPLOI',
      [SEGMENTS.JEUNES_POLE_EMPLOI_BRSA]: 'Jeunes POLE EMPLOI BRSA',
      [SEGMENTS.JEUNES_POLE_EMPLOI_AIJ]: 'Jeunes POLE EMPLOI AIJ',
      [SEGMENTS.JEUNES_POLE_EMPLOI_CD]: 'Jeunes POLE EMPLOI CD',
      [SEGMENTS.JEUNES_POLE_EMPLOI_AVENIR_PRO]:
        'Lycéens POLE EMPLOI Avenir Pro',
      [SEGMENTS.BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_INTENSIF]:
        'Bénéficiaires France Travail Accompagnement intensif',
      [SEGMENTS.BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_GLOBAL]:
        'Bénéficiaires France Travail Accompagnement global',
      [SEGMENTS.BENEFICIAIRES_FRANCE_TRAVAIL_EQUIP_EMPLOI_RECRUT]:
        'Bénéficiaires France Travail Equip’emploi / Equip’recrut'
    }

    Object.entries(metadatas).forEach(([key, value]) => {
      metadataWriteStream.write(
        JSON.stringify({ segment_label: key, display_name: value }) + NEW_LINE
      )
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
      case Core.Structure.POLE_EMPLOI_BRSA:
        return SEGMENTS.JEUNES_POLE_EMPLOI_BRSA
      case Core.Structure.POLE_EMPLOI_AIJ:
        return SEGMENTS.JEUNES_POLE_EMPLOI_AIJ
      case Core.Structure.CONSEIL_DEPT:
        return SEGMENTS.JEUNES_POLE_EMPLOI_CD
      case Core.Structure.AVENIR_PRO:
        return SEGMENTS.JEUNES_POLE_EMPLOI_AVENIR_PRO
      case Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF:
        return SEGMENTS.BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_INTENSIF
      case Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL:
        return SEGMENTS.BENEFICIAIRES_FRANCE_TRAVAIL_ACCOMPAGNEMENT_GLOBAL
      case Core.Structure.FT_EQUIP_EMPLOI_RECRUT:
        return SEGMENTS.BENEFICIAIRES_FRANCE_TRAVAIL_EQUIP_EMPLOI_RECRUT
    }
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
