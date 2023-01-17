import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetRendezVousConseillerPaginesQuery,
  GetRendezVousConseillerPaginesQueryHandler
} from '../../../application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { RendezVousConseillerQueryModel } from '../../../application/queries/query-models/rendez-vous.query-model'
import { isSuccess } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Utilisateur } from '../../decorators/authenticated.decorator'
import { handleFailure } from '../failure.handler'
import { GetRendezVousConseillerV2QueryParams } from '../validation/conseillers.inputs'

@Controller('v2/conseillers')
@ApiOAuth2([])
@ApiTags('Conseillers')
export class ConseillersControllerV2 {
  constructor(
    private readonly getRendezVousConseillerPaginesQueryHandler: GetRendezVousConseillerPaginesQueryHandler
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
}
