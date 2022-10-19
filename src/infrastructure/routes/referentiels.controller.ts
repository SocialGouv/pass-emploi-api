import { Controller, Get, Query } from '@nestjs/common'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetAgencesQueryHandler } from '../../application/queries/get-agences.query.handler'
import {
  GetCommunesEtDepartementsQuery,
  GetCommunesEtDepartementsQueryHandler
} from '../../application/queries/get-communes-et-departements.query.handler.db'
import {
  GetMetiersRomeQuery,
  GetMetiersRomeQueryHandler
} from '../../application/queries/get-metiers-rome.query.handler.db'
import {
  GetMotifsSuppressionJeuneQueryHandler,
  MotifsSuppressionJeuneQueryModel
} from '../../application/queries/get-motifs-suppression-jeune.query.handler'
import { GetTypesQualificationsQueryHandler } from '../../application/queries/get-types-qualifications.query.handler'
import { GetTypesRendezVousQueryHandler } from '../../application/queries/get-types-rendez-vous.query.handler'
import { TypeQualificationQueryModel } from '../../application/queries/query-models/actions.query-model'
import { AgenceQueryModel } from '../../application/queries/query-models/agence.query-model'
import { CommunesEtDepartementsQueryModel } from '../../application/queries/query-models/communes-et-departements.query-model'
import { MetiersRomeQueryModel } from '../../application/queries/query-models/metiers-rome.query-model'
import { TypeRendezVousQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import { TypesDemarcheQueryModel } from '../../application/queries/query-models/types-demarche.query-model'
import { RechercherTypesDemarcheQueryHandler } from '../../application/queries/rechercher-types-demarche.query.handler'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Public } from '../decorators/public.decorator'
import { handleFailure } from './failure.handler'
import { GetAgencesQueryParams } from './validation/agences.inputs'
import { TypesDemarchesQueryParams } from './validation/demarches.inputs'

@Controller('referentiels')
@ApiTags('Referentiels')
export class ReferentielsController {
  constructor(
    private readonly getCommunesEtDepartementsQueryHandler: GetCommunesEtDepartementsQueryHandler,
    private readonly getMetiersRomeQueryHandler: GetMetiersRomeQueryHandler,
    private readonly getTypesRendezvousQueryHandler: GetTypesRendezVousQueryHandler,
    private readonly rechercherTypesDemarcheQueryHandler: RechercherTypesDemarcheQueryHandler,
    private readonly getAgencesQueryHandler: GetAgencesQueryHandler,
    private readonly getMotifsSuppressionJeuneQueryHandler: GetMotifsSuppressionJeuneQueryHandler,
    private readonly getTypesQualificationsQueryHandler: GetTypesQualificationsQueryHandler
  ) {}

  @Get('communes-et-departements')
  @Public()
  @ApiResponse({
    type: CommunesEtDepartementsQueryModel,
    isArray: true
  })
  @ApiQuery({ name: 'villesOnly', required: false, type: 'boolean' })
  async getCommunesEtDepartements(
    @Query('recherche') recherche: string,
    @Query('villesOnly') villesOnly: string
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const query: GetCommunesEtDepartementsQuery = { recherche }
    query.villesOnly = villesOnly === 'true'
    return this.getCommunesEtDepartementsQueryHandler.execute(query)
  }

  @Get('metiers')
  @Public()
  @ApiResponse({
    type: MetiersRomeQueryModel,
    isArray: true
  })
  async getMetiers(
    @Query('recherche') recherche: string
  ): Promise<MetiersRomeQueryModel[]> {
    const query: GetMetiersRomeQuery = { recherche }
    return this.getMetiersRomeQueryHandler.execute(query)
  }

  @Get('types-rendezvous')
  @Public()
  @ApiResponse({
    type: TypeRendezVousQueryModel,
    isArray: true
  })
  async getTypesRendezvous(): Promise<TypeRendezVousQueryModel[]> {
    return this.getTypesRendezvousQueryHandler.execute({})
  }

  @Get('pole-emploi/types-demarches')
  @ApiOAuth2([])
  async getTypesDemarches(
    @Query() query: TypesDemarchesQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<TypesDemarcheQueryModel[]> {
    return this.rechercherTypesDemarcheQueryHandler.execute(query, utilisateur)
  }

  @Get('agences')
  @ApiOAuth2([])
  @ApiResponse({
    type: AgenceQueryModel,
    isArray: true
  })
  async getAgences(
    @Query() structure: GetAgencesQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<AgenceQueryModel[]> {
    return this.getAgencesQueryHandler.execute(structure, utilisateur)
  }

  @Get('motifs-suppression-jeune')
  @ApiOAuth2([])
  @ApiResponse({
    type: String,
    isArray: true
  })
  async getMotifsSuppressionJeune(): Promise<MotifsSuppressionJeuneQueryModel> {
    const result = await this.getMotifsSuppressionJeuneQueryHandler.execute({})
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Get('qualifications-actions/types')
  @ApiOAuth2([])
  @ApiResponse({
    type: TypeQualificationQueryModel,
    isArray: true
  })
  async getTypesQualificationsActions(): Promise<
    TypeQualificationQueryModel[]
  > {
    return this.getTypesQualificationsQueryHandler.execute({})
  }
}
