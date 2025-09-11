import { Controller, Get, Query } from '@nestjs/common'
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetCatalogueDemarchesQueryHandler } from 'src/application/queries/get-catalogue-demarches.query.handler'
import { ThematiqueQueryModel } from 'src/application/queries/query-models/catalogue.query-model'
import { GetActionsPredefiniesQueryHandler } from '../../application/queries/action/get-actions-predefinies.query.handler'
import { GetTypesQualificationsQueryHandler } from '../../application/queries/action/get-types-qualifications.query.handler'
import { GetAgencesQueryHandler } from '../../application/queries/get-agences.query.handler.db'
import {
  GetCommunesEtDepartementsQuery,
  GetCommunesEtDepartementsQueryHandler
} from '../../application/queries/get-communes-et-departements.query.handler.db'
import {
  GetMetiersRomeQuery,
  GetMetiersRomeQueryHandler
} from '../../application/queries/get-metiers-rome.query.handler.db'
import { GetMotifsSuppressionJeuneQueryHandler } from '../../application/queries/get-motifs-suppression-jeune.query.handler'
import {
  ActionPredefinieQueryModel,
  TypeQualificationQueryModel
} from '../../application/queries/query-models/actions.query-model'
import { AgenceQueryModel } from '../../application/queries/query-models/agence.query-model'
import { CommunesEtDepartementsQueryModel } from '../../application/queries/query-models/communes-et-departements.query-model'
import { MotifSuppressionJeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { MetiersRomeQueryModel } from '../../application/queries/query-models/metiers-rome.query-model'
import { TypeRendezVousQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import { GetTypesRendezVousQueryHandler } from '../../application/queries/rendez-vous/get-types-rendez-vous.query.handler'
import { Authentification } from '../../domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { Public } from '../decorators/public.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import { GetAgencesQueryParams } from './validation/agences.inputs'

@Controller('referentiels')
@ApiTags('Referentiels')
export class ReferentielsController {
  constructor(
    private readonly getCommunesEtDepartementsQueryHandler: GetCommunesEtDepartementsQueryHandler,
    private readonly getMetiersRomeQueryHandler: GetMetiersRomeQueryHandler,
    private readonly getTypesRendezvousQueryHandler: GetTypesRendezVousQueryHandler,
    private readonly getCatalogueDemarchesQueryHandler: GetCatalogueDemarchesQueryHandler,
    private readonly getAgencesQueryHandler: GetAgencesQueryHandler,
    private readonly getMotifsSuppressionJeuneQueryHandler: GetMotifsSuppressionJeuneQueryHandler,
    private readonly getTypesQualificationsQueryHandler: GetTypesQualificationsQueryHandler,
    private readonly getActionsPredefiniesQueryHandler: GetActionsPredefiniesQueryHandler
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

  @Get('pole-emploi/catalogue-demarches')
  @CustomSwaggerApiOAuth2()
  async getCatalogueDemarches(
    @AccessToken() accessToken: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ThematiqueQueryModel[]> {
    return this.getCatalogueDemarchesQueryHandler.execute(
      { accessToken, structure: utilisateur.structure },
      utilisateur
    )
  }

  @Get('agences')
  @CustomSwaggerApiOAuth2()
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
  @CustomSwaggerApiOAuth2()
  @ApiResponse({
    type: MotifSuppressionJeuneQueryModel,
    isArray: true
  })
  async getMotifsSuppressionJeune(
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<MotifSuppressionJeuneQueryModel[]> {
    const result = await this.getMotifsSuppressionJeuneQueryHandler.execute({
      structure: utilisateur.structure
    })

    return handleResult(result)
  }

  @Get('qualifications-actions/types')
  @CustomSwaggerApiOAuth2()
  @ApiResponse({
    type: TypeQualificationQueryModel,
    isArray: true
  })
  async getTypesQualificationsActions(): Promise<
    TypeQualificationQueryModel[]
  > {
    return this.getTypesQualificationsQueryHandler.execute({})
  }

  @Get('actions-predefinies')
  @CustomSwaggerApiOAuth2()
  @ApiResponse({
    type: ActionPredefinieQueryModel,
    isArray: true
  })
  async getActionsPredefinies(): Promise<ActionPredefinieQueryModel[]> {
    return this.getActionsPredefiniesQueryHandler.execute({})
  }
}
