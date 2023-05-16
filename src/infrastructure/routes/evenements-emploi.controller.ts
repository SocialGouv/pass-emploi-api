import { Controller, Get, Query } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  GetEvenementsEmploiQuery,
  GetEvenementsEmploiQueryHandler
} from '../../application/queries/get-evenements-emploi.query.handler'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from 'src/domain/authentification'
import { EvenementsEmploiQueryModel } from 'src/application/queries/query-models/evenements-emploi.query-model'
import { FindEvenementsEmploiQueryParams } from './validation/evenements-emploi.inputs'

@Controller('evenements-emploi')
@ApiOAuth2([])
@ApiTags('Evenements emploi')
export class EvenementsEmploiController {
  constructor(
    private readonly getEvenementsEmploiQueryHandler: GetEvenementsEmploiQueryHandler
  ) {}

  @Get()
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
    return result
  }
}
