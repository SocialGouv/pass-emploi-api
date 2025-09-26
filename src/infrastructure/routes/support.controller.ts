import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiConsumes,
  ApiOperation,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger'
import {
  RefreshJddCommand,
  RefreshJddCommandHandler
} from '../../application/commands/support/refresh-jdd.command.handler'
import { ArchiverJeuneSupportCommandHandler } from '../../application/commands/support/archiver-jeune-support.command.handler'
import { CreerSuperviseursCommandHandler } from '../../application/commands/support/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from '../../application/commands/support/delete-superviseurs.command.handler'
import {
  MettreAJourLesJeunesCEJPoleEmploiCommand,
  MettreAJourLesJeunesCejPeCommandHandler
} from '../../application/commands/support/mettre-a-jour-les-jeunes-cej-pe.command.handler'
import {
  ChangementAgenceQueryModel,
  UpdateAgenceConseillerCommandHandler
} from '../../application/commands/support/update-agence-conseiller.command.handler'
import { TransfererJeunesConseillerCommandHandler } from '../../application/commands/transferer-jeunes-conseiller.command.handler'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { handleResult } from './result.handler'
import {
  ChangerAgenceConseillerPayload,
  CreateSuperviseursPayload,
  DeleteSuperviseursPayload,
  NotifierBeneficiairesPayload,
  RefreshJDDPayload,
  TeleverserCsvPayload,
  TransfererJeunesPayload,
  UpdateFeatureFlipPayload
} from './validation/support.inputs'
import { UpdateFeatureFlipCommandHandler } from '../../application/commands/support/update-feature-flip.command.handler'
import { NotifierBeneficiairesCommandHandler } from '../../application/commands/notifier-beneficiaires.command.handler'
import { Notification } from '../../domain/notification/notification'
import { Core } from '../../domain/core'

@Controller('support')
@ApiTags('Support')
@SkipOidcAuth()
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('api_key')
export class SupportController {
  constructor(
    private refreshJddCommandHandler: RefreshJddCommandHandler,
    private mettreAJourLesJeunesCejPeCommandHandler: MettreAJourLesJeunesCejPeCommandHandler,
    private updateAgenceCommandHandler: UpdateAgenceConseillerCommandHandler,
    private archiverJeuneSupportCommandHandler: ArchiverJeuneSupportCommandHandler,
    private transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler,
    private readonly creerSuperviseursCommandHandler: CreerSuperviseursCommandHandler,
    private readonly deleteSuperviseursCommandHandler: DeleteSuperviseursCommandHandler,
    private readonly updateFeatureFlipCommandHandler: UpdateFeatureFlipCommandHandler,
    private readonly notifierBeneficiairesCommandHandler: NotifierBeneficiairesCommandHandler
  ) {}

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @Post('jdd')
  async refresh(@Body() payload: RefreshJDDPayload): Promise<void> {
    const command: RefreshJddCommand = {
      idConseiller: payload.idConseiller,
      menage: payload.menage
    }
    const result = await this.refreshJddCommandHandler.execute(
      command,
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @Post('cej/pole-emploi')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  async postFichierCEJ(
    @Body() _payload: TeleverserCsvPayload,
    @UploadedFile() fichier: Express.Multer.File
  ): Promise<void> {
    const command: MettreAJourLesJeunesCEJPoleEmploiCommand = {
      fichier: fichier
    }
    const result = await this.mettreAJourLesJeunesCejPeCommandHandler.execute(
      command,
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary:
      'Attribue une nouvelle agence au conseiller identifié par son ID (ID en base, et pas ID Authentification)',
    description: 'Autorisé pour le support'
  })
  @Post('changer-agence-conseiller')
  async changerAgenceConseiller(
    @Body() payload: ChangerAgenceConseillerPayload
  ): Promise<ChangementAgenceQueryModel> {
    const command: ChangerAgenceConseillerPayload = {
      idConseiller: payload.idConseiller,
      idNouvelleAgence: payload.idNouvelleAgence
    }
    const result = await this.updateAgenceCommandHandler.execute(
      command,
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary:
      'Archive le jeune identifié par son ID (ID en base, et pas ID Authentification)',
    description:
      ' l’API support pour archiver le jeune\n' +
      '- Suppression de la BDD de son compte utilisateur\n' +
      '- Suppression de l’authentification Keycloak\n' +
      '- Suppression du chat firebase\n' +
      '- Envoi d’un email au jeune\n'
  })
  @Post('archiver-jeune/:idJeune')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiverJeune(@Param('idJeune') idJeune: string): Promise<void> {
    const result = await this.archiverJeuneSupportCommandHandler.execute(
      {
        idJeune
      },
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary: 'Transférer les jeunes renseignés d’un conseiller à un autre',
    description: 'Autorisé pour le support'
  })
  @Post('transferer-jeunes')
  @HttpCode(HttpStatus.NO_CONTENT)
  async transfererJeunesSupport(
    @Body() payload: TransfererJeunesPayload
  ): Promise<void> {
    const result = await this.transfererJeunesConseillerCommandHandler.execute(
      {
        idConseillerSource: payload.idConseillerSource,
        idConseillerCible: payload.idConseillerCible,
        idsJeunes: payload.idsJeunes,
        estTemporaire: false,
        provenanceUtilisateur: Authentification.Type.SUPPORT
      },
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary: 'Ajoute des droits de supervision à des conseillers',
    description: 'Autorisé pour le support'
  })
  @Post('superviseurs')
  async postSuperviseurs(
    @Body() superviseursPayload: CreateSuperviseursPayload
  ): Promise<void> {
    const result = await this.creerSuperviseursCommandHandler.execute(
      {
        superviseurs: superviseursPayload.superviseurs,
        superEmailFT: superviseursPayload.superEmailFT
      },
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary: 'Supprime des droits de supervision à des conseillers',
    description: 'Autorisé pour le support'
  })
  @Delete('superviseurs')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSuperviseurs(
    @Body() superviseursPayload: DeleteSuperviseursPayload
  ): Promise<void> {
    const result = await this.deleteSuperviseursCommandHandler.execute(
      { emails: superviseursPayload.emails },
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary:
      'Modifie les fonctionnalités accessibles pour un groupe de jeunes selon les conseillers qui les accompagnent',
    description: 'Autorisé pour le support'
  })
  @Post('feature-flip')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateFeatureFlip(
    @Body() payload: UpdateFeatureFlipPayload
  ): Promise<void> {
    const result = await this.updateFeatureFlipCommandHandler.execute(
      payload,
      Authentification.unUtilisateurSupport()
    )

    return handleResult(result)
  }

  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.SUPPORT
  )
  @ApiOperation({
    summary:
      'Notifie un groupe de bénéficiaires appartenants à une ou plusieures structures.',
    description: `
Notifie un groupe de bénéficiaires appartenant à une ou plusieurs structures.  

**Champs du body :**
- \`type\` : ${Object.values(Notification.Type).join(', ')}
- \`titre\` : titre de la notification
- \`description\` : texte corps de la notification
- \`structures\` : ${Object.values(Core.Structure).join(', ')}
- \`push\` (❌ pas encore implémenté - pour l'instant toujours en push) (optionnel) : notifie les bénéficiaires en mode push (via Firebase) pour apparaître dans le centre de notifications de l'appareil
- \`batchSize\` (optionnel, défaut = 2000) : taille d’un batch
- \`minutesEntreLesBatch\` (optionnel, défaut = 5) : minutes entre chaque batch

**Exemple JSON :**
\`\`\`json
{
  "type": "OUTILS",
  "titre": "1000 immersions sur la vente et la logistique !",
  "description": "Explorez les métiers de vente et de la logistique",
  "structures": ["MILO","POLE_EMPLOI_AIJ"],
  "push": true,
  "batchSize": 2000,
  "minutesEntreLesBatchs": 5
}
\`\`\`
`
  })
  @Post('notifier-beneficiaires')
  @HttpCode(HttpStatus.CREATED)
  async notifierBeneficiaires(
    @Body() payload: NotifierBeneficiairesPayload
  ): Promise<void> {
    await this.notifierBeneficiairesCommandHandler.execute(payload)
  }

  // TODO ajouter API pour récupérer les jobs (active + delayed)
}
