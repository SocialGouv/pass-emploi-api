import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { FindEvenementsEmploiQueryParams } from './validation/evenements-emploi.inputs'
import {
  EvenementsEmploiQueryModel,
  GetEvenementsEmploiQuery,
  GetEvenementsEmploiQueryHandler
} from '../../application/queries/get-evenements-emploi.query.handler'
import {
  EvenementEmploiDetailQueryModel,
  GetEvenementEmploiQueryHandler
} from '../../application/queries/get-evenement-emploi.query.handler'

@Controller('evenements-emploi')
@ApiOAuth2([])
@ApiTags('Evenements Emploi')
export class EvenementsEmploiController {
  constructor(
    private readonly getEvenementsEmploiQueryHandler: GetEvenementsEmploiQueryHandler,
    private readonly getEvenementEmploiQueryHandler: GetEvenementEmploiQueryHandler
  ) {}

  @ApiOperation({
    summary: 'Récupère la liste des évènements emploi',
    description: 'Ouvert'
  })
  @Get()
  @ApiResponse({
    type: EvenementsEmploiQueryModel
  })
  async getEvenementsEmploi(
    @Query() findEvenementsEmploiQuery: FindEvenementsEmploiQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<EvenementsEmploiQueryModel> {
    const query: GetEvenementsEmploiQuery = {
      page: findEvenementsEmploiQuery.page,
      limit: findEvenementsEmploiQuery.limit,
      codePostal: findEvenementsEmploiQuery.codePostal,
      secteurActivite: findEvenementsEmploiQuery.secteurActivite,
      dateDebut: findEvenementsEmploiQuery.dateDebut,
      dateFin: findEvenementsEmploiQuery.dateFin,
      typeEvenement: findEvenementsEmploiQuery.typeEvenement
    }

    const result = await this.getEvenementsEmploiQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
  @ApiOperation({
    summary: 'Récupère un évènement emploi par son id',
    description: 'Ouvert'
  })
  @Get(':idEvenement')
  @ApiResponse({
    type: EvenementEmploiDetailQueryModel
  })
  async getEvenementEmploi(
    @Param('idEvenement') idEvenement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<EvenementEmploiDetailQueryModel> {
    const result = await this.getEvenementEmploiQueryHandler.execute(
      { idEvenement },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
