import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { firstValueFrom } from 'rxjs'
import { Milo } from '../../domain/milo'
import { DossierMiloDto } from './dto/milo.dto'

@Injectable()
export class MiloHttpRepository implements Milo.Repository {
  private logger: Logger
  private apiUrl: string
  private apiKeyRecupererDossier: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MiloClient')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyRecupererDossier =
      this.configService.get('milo').apiKeyRecupererDossier
  }

  async getDossier(idDossier: string): Promise<Milo.Dossier | undefined> {
    try {
      const dossierDto = await firstValueFrom(
        this.httpService.get<DossierMiloDto>(
          `${this.apiUrl}/dossiers/${idDossier}`,
          {
            headers: { 'X-Gravitee-Api-Key': `${this.apiKeyRecupererDossier}` }
          }
        )
      )

      return {
        id: idDossier,
        prenom: dossierDto.data.prenom,
        nom: dossierDto.data.nomUsage,
        email: dossierDto.data.mail ?? undefined,
        codePostal: dossierDto.data.adresse?.codePostal ?? '',
        dateDeNaissance: dossierDto.data.dateNaissance
      }
    } catch (e) {
      if (e.response.status === 404) {
        return undefined
      }

      this.logger.error(e.statusText)
      throw new RuntimeException(e.statusText)
    }
  }
}
