import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetActionsByJeuneQuery,
  GetActionsByJeuneQueryHandler
} from '../../../application/queries/action/get-actions-by-jeune.query.handler.db'
import { ListeActionsV2QueryModel } from '../../../application/queries/query-models/actions.query-model'
import { isFailure, isSuccess } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import {
  AccessToken,
  Utilisateur
} from '../../decorators/authenticated.decorator'
import { handleFailure } from '../failure.handler'
import {
  GetActionsByJeuneV2QueryParams,
  GetRendezVousJeuneQueryParams,
  MaintenantQueryParams
} from '../validation/jeunes.inputs'
import { RendezVousJeuneQueryModelV2 } from '../../../application/queries/query-models/rendez-vous.query-model'
import { Core } from '../../../domain/core'
import { JeuneHomeDemarcheQueryModelV2 } from '../../../application/queries/query-models/home-jeune.query-model'
import { JeuneHomeAgendaPoleEmploiQueryModelV2 } from '../../../application/queries/query-models/home-jeune-suivi.query-model'
import { DateTime } from 'luxon'
import { GetRendezVousJeuneQueryHandler } from '../../../application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../application/queries/get-jeune-home-demarches.query.handler'
import { GetJeuneHomeAgendaPoleEmploiQueryHandler } from '../../../application/queries/get-jeune-home-agenda-pole-emploi.query.handler'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../../application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'

@Controller('v2/jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesControllerV2 {
  constructor(
    private readonly getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler,
    private readonly getRendezVousJeuneQueryHandler: GetRendezVousJeuneQueryHandler,
    private readonly getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler,
    private readonly getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler,
    private readonly getJeuneHomeAgendaPoleEmploiQueryHandler: GetJeuneHomeAgendaPoleEmploiQueryHandler
  ) {}

  @Get(':idJeune/actions')
  @ApiResponse({
    type: ListeActionsV2QueryModel
  })
  @HttpCode(HttpStatus.PARTIAL_CONTENT)
  async getActions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query() getActionsByJeuneQueryParams: GetActionsByJeuneV2QueryParams
  ): Promise<ListeActionsV2QueryModel> {
    const query: GetActionsByJeuneQuery = {
      idJeune,
      page: getActionsByJeuneQueryParams.page,
      tri: getActionsByJeuneQueryParams.tri,
      statuts: getActionsByJeuneQueryParams.statuts,
      etats: getActionsByJeuneQueryParams.etats
    }

    const result = await this.getActionsByJeuneQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @Get(':idJeune/rendezvous')
  @ApiResponse({
    type: RendezVousJeuneQueryModelV2
  })
  async getRendezVous(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getRendezVousQueryParams?: GetRendezVousJeuneQueryParams
  ): Promise<RendezVousJeuneQueryModelV2> {
    if (utilisateur.structure === Core.Structure.POLE_EMPLOI && accessToken) {
      const result =
        await this.getRendezVousJeunePoleEmploiQueryHandler.execute(
          {
            idJeune,
            accessToken,
            periode: getRendezVousQueryParams?.periode
          },
          utilisateur
        )
      if (isFailure(result)) {
        throw handleFailure(result)
      }
      return {
        resultat: result.data.queryModel,
        dateDerniereMiseAJour: result.data.dateDuCache?.toJSDate()
      }
    } else {
      const result = await this.getRendezVousJeuneQueryHandler.execute(
        {
          idJeune,
          periode: getRendezVousQueryParams?.periode
        },
        utilisateur
      )
      if (isSuccess(result)) {
        return {
          resultat: result.data
        }
      }
      throw handleFailure(result)
    }
  }

  @Get(':idJeune/home/demarches')
  @ApiResponse({
    type: JeuneHomeDemarcheQueryModelV2
  })
  async getHomeDemarches(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<JeuneHomeDemarcheQueryModelV2> {
    const result = await this.getJeuneHomeDemarchesQueryHandler.execute(
      {
        idJeune,
        accessToken
      },
      utilisateur
    )
    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return {
      resultat: result.data.queryModel,
      dateDerniereMiseAJour: result.data.dateDuCache?.toJSDate()
    }
  }

  @Get(':idJeune/home/agenda/pole-emploi')
  @ApiResponse({
    type: JeuneHomeAgendaPoleEmploiQueryModelV2
  })
  async getHomeAgendaPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<JeuneHomeAgendaPoleEmploiQueryModelV2> {
    const maintenant = DateTime.fromISO(queryParams.maintenant, {
      setZone: true
    })
    const result = await this.getJeuneHomeAgendaPoleEmploiQueryHandler.execute(
      { idJeune, maintenant, accessToken },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return {
      resultat: result.data.queryModel,
      dateDerniereMiseAJour: result.data.dateDuCache?.toJSDate()
    }
  }
}
