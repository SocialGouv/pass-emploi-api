import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetDetailOffreEmploiQuery,
  GetDetailOffreEmploiQueryHandler
} from '../../application/queries/get-detail-offre-emploi.query.handler'
import {
  GetOffresEmploiQuery,
  GetOffresEmploiQueryHandler
} from '../../application/queries/get-offres-emploi.query.handler'
import {
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from '../../application/queries/query-models/offres-emploi.query-model'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { FindOffresEmploiQueryParams } from './validation/offres-emploi.inputs'
import { Core } from '../../domain/core'

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
  async getOffresEmploi(
    @Query() findOffresEmploiQuery: FindOffresEmploiQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffresEmploiQueryModel> {
    const alternanceRecuperable = Core.touteStructureSaufBRSA.includes(
      utilisateur.structure
    )
    const query: GetOffresEmploiQuery = {
      page: findOffresEmploiQuery.page,
      limit: findOffresEmploiQuery.limit,
      q: findOffresEmploiQuery.q,
      departement: findOffresEmploiQuery.departement,
      alternance: alternanceRecuperable
        ? findOffresEmploiQuery.alternance
        : false,
      experience: findOffresEmploiQuery.experience,
      debutantAccepte: findOffresEmploiQuery.debutantAccepte,
      contrat: findOffresEmploiQuery.contrat,
      duree: findOffresEmploiQuery.duree,
      rayon: findOffresEmploiQuery.rayon,
      commune: findOffresEmploiQuery.commune
    }

    const result = await this.getOffresEmploiQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Get(':idOffreEmploi')
  @ApiResponse({
    type: OffreEmploiQueryModel
  })
  async getDetailOffreEmploi(
    @Param('idOffreEmploi') idOffreEmploi: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEmploiQueryModel | undefined> {
    const query: GetDetailOffreEmploiQuery = { idOffreEmploi }
    const result = await this.getDetailOffreEmploiQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
