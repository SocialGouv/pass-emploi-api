import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { handleResult } from 'src/infrastructure/routes/result.handler'
import { GetTokenPoleEmploiQueryHandler } from 'src/application/queries/get-token-pole-emploi.query.handler'

import { Authentification } from '../../domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'

import { MaintenantQueryParams } from './validation/jeunes.inputs'
import { GetAccueilJeunePoleEmploiQueryHandler } from '../../application/queries/pole-emploi/get-accueil-jeune-pole-emploi.query.handler.db'
import {
  AccueilJeunePoleEmploiQueryModel,
  CVPoleEmploiQueryModel
} from '../../application/queries/query-models/jeunes.pole-emploi.query-model'
import { GetCVPoleEmploiQueryHandler } from '../../application/queries/get-cv-pole-emploi.query.handler'
import { GetSuiviSemainePoleEmploiQueryHandler } from '../../application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { DateTime } from 'luxon'
import { JeuneHomeAgendaPoleEmploiQueryModelV2 } from '../../application/queries/query-models/home-jeune-suivi.query-model'
import { GetJeuneHomeDemarchesQueryHandler } from '../../application/queries/get-jeune-home-demarches.query.handler'
import { JeuneHomeDemarcheQueryModelV2 } from '../../application/queries/query-models/home-jeune.query-model'
import {
  CreateDemarcheCommandHandler,
  CreateDemarcheCommand
} from '../../application/commands/pole-emploi/create-demarche.command.handler'
import {
  UpdateStatutDemarcheCommandHandler,
  UpdateStatutDemarcheCommand
} from '../../application/commands/pole-emploi/update-demarche.command.handler'
import { toDemarcheQueryModel } from '../../application/queries/query-mappers/demarche.mappers'
import { DemarcheQueryModel } from '../../application/queries/query-models/actions.query-model'
import {
  UpdateStatutDemarchePayload,
  CreateDemarchePayload
} from './validation/demarches.inputs'

@Controller()
@ApiOAuth2([])
@ApiTags('Jeunes Pôle Emploi')
export class JeunesPoleEmploiController {
  constructor(
    private readonly getAccueilJeunePoleEmploiQueryHandler: GetAccueilJeunePoleEmploiQueryHandler,
    private readonly getCVPoleEmploiQueryHandler: GetCVPoleEmploiQueryHandler,
    private readonly getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler,
    private readonly getJeuneHomeAgendaPoleEmploiQueryHandler: GetSuiviSemainePoleEmploiQueryHandler,
    private readonly getTokenPoleEmploiQueryHandler: GetTokenPoleEmploiQueryHandler,
    private readonly updateStatutDemarcheCommandHandler: UpdateStatutDemarcheCommandHandler,
    private readonly createDemarcheCommandHandler: CreateDemarcheCommandHandler
  ) {}

  @Get('jeunes/:idJeune/pole-emploi/accueil')
  @ApiOperation({
    summary:
      "Permet de récupérer les éléments de la page d'accueil d'un jeune Pôle Emploi",
    description: 'Autorisé pour un jeune Pole Emploi'
  })
  @ApiResponse({
    type: AccueilJeunePoleEmploiQueryModel
  })
  async getAccueilPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<AccueilJeunePoleEmploiQueryModel> {
    const result = await this.getAccueilJeunePoleEmploiQueryHandler.execute(
      { idJeune, maintenant: queryParams.maintenant, accessToken },
      utilisateur
    )

    return handleResult(result)
  }

  @Get('jeunes/:idJeune/pole-emploi/cv')
  @ApiOperation({
    summary: "Permet de récupérer les cvs d'un jeune Pôle Emploi",
    description: 'Autorisé pour un jeune Pole Emploi'
  })
  @ApiResponse({
    type: CVPoleEmploiQueryModel,
    isArray: true
  })
  async getCVPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<CVPoleEmploiQueryModel[]> {
    const result = await this.getCVPoleEmploiQueryHandler.execute(
      { idJeune, accessToken },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: "Modifie le statut d'une démarche"
  })
  @Put('jeunes/:idJeune/demarches/:idDemarche/statut')
  async udpateStatutDemarche(
    @Param('idJeune') idJeune: string,
    @Param('idDemarche') idDemarche: string,
    @Body() updateDemarchePayload: UpdateStatutDemarchePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DemarcheQueryModel> {
    const command: UpdateStatutDemarcheCommand = {
      ...updateDemarchePayload,
      dateFin: DateTime.fromISO(updateDemarchePayload.dateFin, {
        setZone: true
      }),
      dateDebut: updateDemarchePayload.dateDebut
        ? DateTime.fromISO(updateDemarchePayload.dateDebut, { setZone: true })
        : undefined,
      idJeune,
      idDemarche,
      accessToken
    }
    const result = await this.updateStatutDemarcheCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result, toDemarcheQueryModel)
  }

  @ApiOperation({
    summary: 'Crée une démarche',
    description: `Permet de créer une démarche personnalisée ou du référentiel PE.
    Dans le cas d'une démarche personnalisée il faut remplir dateFin et description.
    Dans le cas d'une démarche du référentiel il faut remplir dateFin, codeQuoi, codePourquoi et optionnellement codeComment.
    `
  })
  @Post('jeunes/:idJeune/demarches')
  async createDemarche(
    @Param('idJeune') idJeune: string,
    @Body() createDemarchePayload: CreateDemarchePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DemarcheQueryModel> {
    const command: CreateDemarcheCommand = {
      ...createDemarchePayload,
      dateFin: DateTime.fromISO(createDemarchePayload.dateFin, {
        setZone: true
      }),
      idJeune,
      accessToken
    }
    const result = await this.createDemarcheCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result, toDemarcheQueryModel)
  }

  @Get('v2/jeunes/:idJeune/home/demarches')
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

    return handleResult(result, ({ dateDuCache, queryModel }) => ({
      resultat: queryModel,
      dateDerniereMiseAJour: dateDuCache?.toJSDate()
    }))
  }

  @Get('v2/jeunes/:idJeune/home/agenda/pole-emploi')
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

    return handleResult(result, ({ dateDuCache, queryModel }) => ({
      resultat: queryModel,
      dateDerniereMiseAJour: dateDuCache?.toJSDate()
    }))
  }

  @Get('jeunes/:idJeune/pole-emploi/idp-token')
  @ApiOperation({
    summary:
      "Permet de récupérer le token d’identité d'un jeune Pôle Emploi (à échanger par exemple avec CVM)",
    description: 'Autorisé pour un jeune Pole Emploi'
  })
  @ApiResponse({ type: String })
  async getTokenPoleEmploi(
    @Param('idJeune') idJeune: string,
    @AccessToken() accessToken: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<string> {
    const result = await this.getTokenPoleEmploiQueryHandler.execute(
      { idJeune, accessToken },
      utilisateur
    )

    return handleResult(result)
  }
}
