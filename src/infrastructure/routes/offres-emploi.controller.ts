import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../application/queries/get-offres-emploi.query.handler'
import {
  GetDetailOffreEmploiQuery,
  GetDetailOffreEmploiQueryHandler
} from '../../application/queries/get-detail-offre-emploi.query.handler'
import { FindOffresEmploiQuery } from './validation/offres-emploi.inputs'
import {
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'

@Controller('offres-emploi')
@ApiTags("Offres d'emploi")
export class OffresEmploiController {
  constructor(
    private readonly getOffresEmploiQueryHandler: GetOffresEmploiQueryHandler,
    private readonly getDetailOffreEmploiQueryHandler: GetDetailOffreEmploiQueryHandler
  ) {}

  @Get() getOffresEmploi(
    @Query() findOffresEmploiQuery: FindOffresEmploiQuery
  ): Promise<OffresEmploiQueryModel> {
    const query: GetOffresEmploiQuery = {
      page: findOffresEmploiQuery.page
        ? parseInt(findOffresEmploiQuery.page)
        : undefined,
      limit: findOffresEmploiQuery.limit
        ? parseInt(findOffresEmploiQuery.limit)
        : undefined,
      query: findOffresEmploiQuery.q,
      departement: findOffresEmploiQuery.departement,
      alternance: findOffresEmploiQuery.alternance === 'true'
    }
    return this.getOffresEmploiQueryHandler.execute(query)
  }

  @Get(':idOffreEmploi')
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
