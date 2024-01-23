import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import {
  AgendaConseillerMiloSessionListItemQueryModel,
  DetailSessionConseillerMiloQueryModel,
  SessionConseillerMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { isFailure, isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../../application/commands/milo/creer-jeune-milo.command.handler'
import {
  EmargerSessionMiloCommand,
  EmargerSessionMiloCommandHandler
} from '../../../application/commands/milo/emarger-session-milo.command.handler'
import {
  QualificationActionsMiloQueryModel,
  QualifierActionsMiloCommand,
  QualifierActionsMiloCommandHandler
} from '../../../application/commands/milo/qualifier-actions-milo.command.handler'
import { GetDossierMiloJeuneQueryHandler } from '../../../application/queries/get-dossier-milo-jeune.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from '../../../application/queries/get-jeune-milo-by-dossier.query.handler.db'
import {
  IdentiteJeuneQueryModel,
  JeuneQueryModel
} from '../../../application/queries/query-models/jeunes.query-model'
import { DossierJeuneMiloQueryModel } from '../../../application/queries/query-models/milo.query-model'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import {
  AccessToken,
  Utilisateur
} from '../../decorators/authenticated.decorator'
import { handleFailure, handleResult } from '../result.handler'
import {
  EmargementsSessionMiloPayload,
  GetAgendaSessionsQueryParams,
  GetSessionsQueryParams,
  QualifierActionsMiloPayload,
  UpdateSessionMiloPayload
} from './validation/conseillers.milo.inputs'
import { CreerJeuneMiloPayload } from '../validation/conseillers.inputs'

@Controller('conseillers/milo')
@ApiOAuth2([])
@ApiTags('Conseillers Milo')
export class ConseillersMiloController {
  constructor(
    private readonly getSessionsQueryHandler: GetSessionsConseillerMiloQueryHandler,
    private readonly getDetailSessionQueryHandler: GetDetailSessionConseillerMiloQueryHandler,
    private readonly getAgendaSessionsQueryHandler: GetAgendaSessionsConseillerMiloQueryHandler,
    private readonly updateSessionCommandHandler: UpdateSessionMiloCommandHandler,
    private readonly emargementSessionCommandHandler: EmargerSessionMiloCommandHandler,
    private readonly getDossierMiloJeuneQueryHandler: GetDossierMiloJeuneQueryHandler,
    private readonly getJeuneMiloByDossierQueryHandler: GetJeuneMiloByDossierQueryHandler,
    private readonly creerJeuneMiloCommandHandler: CreerJeuneMiloCommandHandler,
    private readonly qualifierActionsMiloCommandHandler: QualifierActionsMiloCommandHandler
  ) {}
  @ApiOperation({
    summary: "Récupère le dossier Milo d'un jeune",
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('/dossiers/:idDossier')
  @ApiResponse({
    type: DossierJeuneMiloQueryModel
  })
  async getDossierMilo(
    @Param('idDossier') idDossier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DossierJeuneMiloQueryModel> {
    const result = await this.getDossierMiloJeuneQueryHandler.execute(
      { idDossier },
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      throw new RuntimeException(result.error.message)
    }

    return result.data
  }

  @ApiOperation({
    summary: 'Récupère un jeune par son idDossier Milo',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('/jeunes/:idDossier')
  @ApiResponse({
    type: JeuneQueryModel
  })
  async getJeuneMiloByDossier(
    @Param('idDossier') idDossier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneQueryModel> {
    const result = await this.getJeuneMiloByDossierQueryHandler.execute(
      { idDossier },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Crée un jeune Milo',
    description: 'Autorisé pour un conseiller Milo'
  })
  @Post('/jeunes')
  async postJeuneMilo(
    @Body() creerJeuneMiloPayload: CreerJeuneMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<IdentiteJeuneQueryModel> {
    const command: CreerJeuneMiloCommand = {
      idConseiller: creerJeuneMiloPayload.idConseiller,
      email: creerJeuneMiloPayload.email,
      nom: creerJeuneMiloPayload.nom,
      prenom: creerJeuneMiloPayload.prenom,
      idPartenaire: creerJeuneMiloPayload.idDossier
    }
    const result = await this.creerJeuneMiloCommandHandler.execute(
      command,
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Récupère la liste des sessions de sa structure MILO',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/sessions')
  @ApiResponse({
    type: SessionConseillerMiloQueryModel,
    isArray: true
  })
  async getSessions(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsQueryParams: GetSessionsQueryParams
  ): Promise<SessionConseillerMiloQueryModel[]> {
    const result = await this.getSessionsQueryHandler.execute(
      {
        idConseiller,
        accessToken: accessToken,
        dateDebut: DateService.fromStringToDateTime(
          getSessionsQueryParams.dateDebut
        ),
        dateFin: DateService.fromStringToDateTime(
          getSessionsQueryParams.dateFin
        ),
        filtrerAClore: getSessionsQueryParams.filtrerAClore
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Récupère la liste des sessions de sa structure MILO auxquelles participent ses bénéficiaires',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/agenda/sessions')
  @ApiResponse({
    type: AgendaConseillerMiloSessionListItemQueryModel,
    isArray: true
  })
  async getAgendaSessions(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsQueryParams: GetAgendaSessionsQueryParams
  ): Promise<AgendaConseillerMiloSessionListItemQueryModel[]> {
    const result = await this.getAgendaSessionsQueryHandler.execute(
      {
        idConseiller,
        accessToken,
        dateDebut: DateTime.fromISO(getSessionsQueryParams.dateDebut),
        dateFin: DateTime.fromISO(getSessionsQueryParams.dateFin)
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Récupère le détail d’une session de la structure MILO du conseiller',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/sessions/:idSession')
  @ApiResponse({
    type: DetailSessionConseillerMiloQueryModel
  })
  async getDetailSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DetailSessionConseillerMiloQueryModel> {
    const result = await this.getDetailSessionQueryHandler.execute(
      { idSession, idConseiller, accessToken: accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Permet de clore une session de la structure MILO du conseiller et de faire son émargement.',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Post('/:idConseiller/sessions/:idSession/cloturer')
  async emargerSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Body() emargementSessionMiloPayload: EmargementsSessionMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<void> {
    const command: EmargerSessionMiloCommand = {
      idSession,
      idConseiller,
      accessToken: accessToken,
      emargements: emargementSessionMiloPayload.emargements
    }

    const result = await this.emargementSessionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Modifie les informations d’une session de la structure MILO du conseiller (visibilité, inscriptions)',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Patch('/:idConseiller/sessions/:idSession')
  async updateSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Body() updateSessionMiloPayload: UpdateSessionMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<void> {
    const command: UpdateSessionMiloCommand = {
      idSession,
      idConseiller,
      accessToken: accessToken,
      estVisible: updateSessionMiloPayload.estVisible,
      inscriptions: updateSessionMiloPayload.inscriptions
    }

    const result = await this.updateSessionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Qualifie des actions en SNP / non-SNP',
    description: 'Autorisé pour un conseiller Milo'
  })
  @Post('actions/qualifier')
  async qualifierActions(
    @Body() qualifierActionsMiloPayload: QualifierActionsMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<QualificationActionsMiloQueryModel> {
    const command: QualifierActionsMiloCommand = {
      estSNP: qualifierActionsMiloPayload.estSNP,
      qualifications: qualifierActionsMiloPayload.qualifications.map(
        qualifierActionPayload => {
          return {
            idAction: qualifierActionPayload.idAction,
            codeQualification: qualifierActionPayload.codeQualification
          }
        }
      )
    }

    const result = await this.qualifierActionsMiloCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }
}
