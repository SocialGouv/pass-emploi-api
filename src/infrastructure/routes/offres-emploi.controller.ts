import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException
} from '@nestjs/common'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../application/queries/get-offres-emploi.query.handler'
import {
  GetDetailOffreEmploiQuery,
  GetDetailOffreEmploiQueryHandler
} from '../../application/queries/get-detail-offre-emploi.query.handler'
import {
  OffresEmploiQueryModel,
  OffreEmploiQueryModel
} from '../../domain/offres-emploi'
import { FindOffresEmploiPayload } from './validation/offres-emploi.inputs'

@Controller('offres-emploi')
export class OffresEmploiController {
  constructor(
    private readonly getOffresEmploiQueryHandler: GetOffresEmploiQueryHandler,
    private readonly getDetailOffreEmploiQueryHandler: GetDetailOffreEmploiQueryHandler
  ) {}

  @Get() getOffresEmploi(
    @Query() findOffresEmploiPayload: FindOffresEmploiPayload
  ): Promise<OffresEmploiQueryModel> {
    const query: GetOffresEmploiQuery = {
      page: findOffresEmploiPayload.page,
      limit: findOffresEmploiPayload.limit,
      departement: findOffresEmploiPayload.departement,
      alternance: findOffresEmploiPayload.alternance === 'true'
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
