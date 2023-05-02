import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetActionsConseillerV2QueryHandler } from '../../../application/queries/action/get-actions-conseiller-v2.query.handler.db'
import { GetActionsConseillerV2QueryModel } from '../../../application/queries/query-models/conseillers.query-model'
import { RendezVousConseillerQueryModel } from '../../../application/queries/query-models/rendez-vous.query-model'
import {
  GetRendezVousConseillerPaginesQuery,
  GetRendezVousConseillerPaginesQueryHandler
} from '../../../application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import {
  isFailure,
  isSuccess,
  Result
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Utilisateur } from '../../decorators/authenticated.decorator'
import { handleFailure } from '../failure.handler'
import {
  GetActionsConseillerV2QueryParams,
  GetRendezVousConseillerV2QueryParams
} from '../validation/conseillers.inputs'

@Controller('v2/conseillers')
@ApiOAuth2([])
@ApiTags('Conseillers')
export class ConseillersControllerV2 {
  constructor(
    private readonly getRendezVousConseillerPaginesQueryHandler: GetRendezVousConseillerPaginesQueryHandler,
    private readonly getActionsDuConseillerQueryHandler: GetActionsConseillerV2QueryHandler
  ) {}

  @ApiOperation({
    summary: "Récupère les rendez-vous d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
  @Get(':idConseiller/rendezvous')
  @ApiResponse({
    type: RendezVousConseillerQueryModel,
    isArray: true
  })
  @HttpCode(HttpStatus.PARTIAL_CONTENT)
  async getRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getRendezVousConseillerQueryParams: GetRendezVousConseillerV2QueryParams
  ): Promise<RendezVousConseillerQueryModel[]> {
    const query: GetRendezVousConseillerPaginesQuery = {
      idConseiller,
      tri: getRendezVousConseillerQueryParams.tri,
      dateDebut: getRendezVousConseillerQueryParams.dateDebut,
      dateFin: getRendezVousConseillerQueryParams.dateFin,
      presenceConseiller: getRendezVousConseillerQueryParams.presenceConseiller
    }

    const result =
      await this.getRendezVousConseillerPaginesQueryHandler.execute(
        query,
        utilisateur
      )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Récupère l’ensemble des actions des jeunes du portefeuille du conseiller',
    description: 'Autorisé pour le conseiller'
  })
  @ApiResponse({
    type: GetActionsConseillerV2QueryModel
  })
  @Get(':idConseiller/actions')
  async getActionsV2(
    @Param('idConseiller') idConseiller: string,
    @Query()
    getActionsConseillerV2QueryParams: GetActionsConseillerV2QueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<GetActionsConseillerV2QueryModel> {
    const result: Result<GetActionsConseillerV2QueryModel> =
      await this.getActionsDuConseillerQueryHandler.execute(
        {
          idConseiller,
          page: getActionsConseillerV2QueryParams.page,
          limit: getActionsConseillerV2QueryParams.limit,
          aQualifier: getActionsConseillerV2QueryParams.aQualifier
        },
        utilisateur
      )
    if (isFailure(result)) {
      throw handleFailure(result)
    }
    return result.data
  }
}
