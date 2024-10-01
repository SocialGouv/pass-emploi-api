import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
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
  SessionConseillerMiloQueryModel,
  SessionsConseillerV2QueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../application/commands/milo/creer-jeune-milo.command.handler'
import {
  EmargerSessionMiloCommand,
  EmargerSessionMiloCommandHandler
} from '../../application/commands/milo/emarger-session-milo.command.handler'
import {
  QualificationActionsMiloQueryModel,
  QualifierActionsMiloCommand,
  QualifierActionsMiloCommandHandler
} from '../../application/commands/milo/qualifier-actions-milo.command.handler'
import { GetDossierMiloJeuneQueryHandler } from '../../application/queries/get-dossier-milo-jeune.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from '../../application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { GetSessionsConseillerMiloV2QueryHandler } from '../../application/queries/milo/v2/get-sessions-conseiller.milo.v2.query.handler.db'
import {
  IdentiteJeuneQueryModel,
  JeuneQueryModel
} from '../../application/queries/query-models/jeunes.query-model'
import { DossierJeuneMiloQueryModel } from '../../application/queries/query-models/milo.query-model'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import { CreerJeuneMiloPayload } from './validation/conseillers.inputs'
import {
  EmargementsSessionMiloPayload,
  GetAgendaSessionsQueryParams,
  GetSessionsQueryParams,
  GetSessionsV2QueryParams,
  QualifierActionsMiloPayload,
  UpdateSessionMiloPayload
} from './validation/conseillers.milo.inputs'
import { CompteursBeneficiaireQueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import { GetPortefeuilleParams } from 'src/infrastructure/routes/validation/jeunes.milo.inputs'
import { GetCompteursBeneficiaireMiloQueryHandler } from 'src/application/queries/milo/get-compteurs-portefeuille-milo.query.handler.db'

@Controller()
@CustomSwaggerApiOAuth2()
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
    private readonly qualifierActionsMiloCommandHandler: QualifierActionsMiloCommandHandler,
    private readonly getSessionsV2QueryHandler: GetSessionsConseillerMiloV2QueryHandler,
    private readonly getCompteursBeneficiaireMiloQueryHandler: GetCompteursBeneficiaireMiloQueryHandler
  ) {}
  @ApiOperation({
    summary: "Récupère le dossier Milo d'un jeune",
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('conseillers/milo/dossiers/:idDossier')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Récupère un jeune par son idDossier Milo',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('conseillers/milo/jeunes/:idDossier')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Crée un jeune Milo',
    description: 'Autorisé pour un conseiller Milo'
  })
  @Post('conseillers/milo/jeunes')
  async postJeuneMilo(
    @Body() creerJeuneMiloPayload: CreerJeuneMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<IdentiteJeuneQueryModel> {
    const command: CreerJeuneMiloCommand = {
      idConseiller: creerJeuneMiloPayload.idConseiller,
      email: creerJeuneMiloPayload.email,
      nom: creerJeuneMiloPayload.nom,
      prenom: creerJeuneMiloPayload.prenom,
      idPartenaire: creerJeuneMiloPayload.idDossier,
      surcharge: creerJeuneMiloPayload.surcharge
    }
    const result = await this.creerJeuneMiloCommandHandler.execute(
      command,
      utilisateur
    )
    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Récupère la liste des sessions de sa structure MILO',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('conseillers/milo/:idConseiller/sessions')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      'Récupère la liste des sessions de sa structure MILO auxquelles participent ses bénéficiaires',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('conseillers/milo/:idConseiller/agenda/sessions')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      'Récupère le détail d’une session de la structure MILO du conseiller',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('conseillers/milo/:idConseiller/sessions/:idSession')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      'Permet de clore une session de la structure MILO du conseiller et de faire son émargement.',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Post('conseillers/milo/:idConseiller/sessions/:idSession/cloturer')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      'Modifie les informations d’une session de la structure MILO du conseiller (visibilité, inscriptions)',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Patch('conseillers/milo/:idConseiller/sessions/:idSession')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Qualifie des actions en SNP / non-SNP',
    description: 'Autorisé pour un conseiller Milo'
  })
  @Post('conseillers/milo/actions/qualifier')
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

  @ApiOperation({
    summary:
      'Récupère la liste des sessions avec pagination de sa structure MILO',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('v2/conseillers/milo/:idConseiller/sessions')
  @ApiResponse({
    type: SessionConseillerMiloQueryModel,
    isArray: true
  })
  async getSessionsV2(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsACloreQueryParams: GetSessionsV2QueryParams
  ): Promise<SessionsConseillerV2QueryModel> {
    const result = await this.getSessionsV2QueryHandler.execute(
      {
        idConseiller,
        accessToken: accessToken,
        page: getSessionsACloreQueryParams.page,
        filtrerAClore: getSessionsACloreQueryParams.filtrerAClore
      },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    description: 'Compte des trucs des bénéficiaires du conseiller'
  })
  @Get('/conseillers/milo/:idConseiller/compteurs-portefeuille')
  @ApiResponse({
    type: CompteursBeneficiaireQueryModel,
    isArray: true
  })
  async getCompteursPortefeuille(
    @Param('idConseiller') idConseiller: string,
    @Query() queryParams: GetPortefeuilleParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<CompteursBeneficiaireQueryModel[]> {
    const result = await this.getCompteursBeneficiaireMiloQueryHandler.execute(
      {
        idConseiller,
        accessToken,
        dateDebut: DateTime.fromISO(queryParams.dateDebut, {
          setZone: true
        }),
        dateFin: DateTime.fromISO(queryParams.dateFin, {
          setZone: true
        })
      },
      utilisateur
    )
    return handleResult(result)
  }
}
