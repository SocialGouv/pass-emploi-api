import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  EvenementEmploiDetailQueryModel,
  GetEvenementEmploiQueryHandler
} from '../../application/queries/get-evenement-emploi.query.handler'
import {
  EvenementsEmploiQueryModel,
  GetEvenementsEmploiQuery,
  GetEvenementsEmploiQueryHandler
} from '../../application/queries/get-evenements-emploi.query.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import { FindEvenementsEmploiQueryParams } from './validation/evenements-emploi.inputs'

@Controller('evenements-emploi')
@CustomSwaggerApiOAuth2()
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
      typeEvenement: findEvenementsEmploiQuery.typeEvenement,
      modalite: findEvenementsEmploiQuery.modalite
    }

    const result = await this.getEvenementsEmploiQueryHandler.execute(
      query,
      utilisateur
    )

    return handleResult(result)
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

    return handleResult(result)
  }
}
