import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import {
  GetDetailOffreEmploiQuery,
  GetDetailOffreEmploiQueryHandler
} from '../../application/queries/get-detail-offre-emploi.query.handler'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../application/queries/get-offres-emploi.query.handler'
import { FindOffresEmploiQuery } from './validation/offres-emploi.inputs'

@Controller('offres-emploi')
@ApiOAuth2([])
@ApiTags("Offres d'emploi")
export class OffresEmploiController {
  constructor(
    private readonly getOffresEmploiQueryHandler: GetOffresEmploiQueryHandler,
    private readonly getDetailOffreEmploiQueryHandler: GetDetailOffreEmploiQueryHandler
  ) {}

  @Get()
  @ApiResponse({
    type: OffresEmploiQueryModel
  })
  getOffresEmploi(
    @Query() findOffresEmploiQuery: FindOffresEmploiQuery
  ): Promise<OffresEmploiQueryModel> {
    const query: GetOffresEmploiQuery = {
      page: findOffresEmploiQuery.page,
      limit: findOffresEmploiQuery.limit,
      query: findOffresEmploiQuery.q,
      departement: findOffresEmploiQuery.departement,
      alternance: findOffresEmploiQuery.alternance,
      experience: findOffresEmploiQuery.experience,
      contrat: findOffresEmploiQuery.contrat,
      duree: findOffresEmploiQuery.duree,
      rayon: findOffresEmploiQuery.rayon,
      commune: findOffresEmploiQuery.commune
    }

    return this.getOffresEmploiQueryHandler.execute(query)
  }

  @Get(':idOffreEmploi')
  @ApiResponse({
    type: OffreEmploiQueryModel
  })
  async getDetailOffreEmploi(
    @Param('idOffreEmploi') idOffreEmploi: string
  ): Promise<OffreEmploiQueryModel | undefined> {
    const query: GetDetailOffreEmploiQuery = { idOffreEmploi }
    const offreEmploiqueryModel =
      await this.getDetailOffreEmploiQueryHandler.execute(query)

    if (offreEmploiqueryModel) {
      return offreEmploiqueryModel
    }

    throw new HttpException(
      `Offre d'emploi ${idOffreEmploi} not found`,
      HttpStatus.NOT_FOUND
    )
  }
}
