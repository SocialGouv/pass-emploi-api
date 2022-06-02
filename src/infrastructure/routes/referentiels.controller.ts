import { Controller, Get, Query } from '@nestjs/common'
import { ApiOAuth2, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetTypesRendezVousQueryHandler } from 'src/application/queries/get-types-rendez-vous.query.handler'
import { TypesRendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import {
  GetCommunesEtDepartementsQuery,
  GetCommunesEtDepartementsQueryHandler
} from '../../application/queries/get-communes-et-departements.query.handler.db'
import { CommunesEtDepartementsQueryModel } from '../../application/queries/query-models/communes-et-departements.query-model'
import { Public } from '../decorators/public.decorator'
import { AgenceQueryModel } from '../../application/queries/query-models/agence.query-models'
import { GetAgencesQueryHandler } from '../../application/queries/get-agences.query.handler'
import { GetAgencesQueryParams } from './validation/agences.inputs'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'

@Controller('referentiels')
@ApiTags('Referentiels')
export class ReferentielsController {
  constructor(
    private readonly getCommunesEtDepartementsQueryHandler: GetCommunesEtDepartementsQueryHandler,
    private readonly getTypesRendezvousQueryHandler: GetTypesRendezVousQueryHandler,
    private readonly getAgencesQueryHandler: GetAgencesQueryHandler
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

  @Get('types-rendezvous')
  @Public()
  @ApiResponse({
    isArray: true
  })
  async getTypesRendezvous(): Promise<TypesRendezVousQueryModel> {
    return this.getTypesRendezvousQueryHandler.execute({})
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
}
