import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { EvenementMilo } from '../../../domain/milo/evenement.milo'
import { RendezVousMilo } from '../../../domain/milo/rendez-vous.milo'
import { RateLimiterService } from '../../../utils/rate-limiter.service'
import { RendezVousMiloDto } from '../dto/milo.dto'

@Injectable()
export class RendezVousMiloHttpRepository implements RendezVousMilo.Repository {
  private readonly apiUrl: string
  private readonly apiKeyDetailRendezVous: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService
  ) {
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyDetailRendezVous =
      this.configService.get('milo').apiKeyDetailRendezVous
  }

  async findRendezVousByEvenement(
    evenement: EvenementMilo
  ): Promise<RendezVousMilo | undefined> {
    if (evenement.objet !== EvenementMilo.ObjetEvenement.RENDEZ_VOUS) {
      return undefined
    }
    try {
      await this.rateLimiterService.dossierSessionRDVMiloRateLimiter.attendreLaProchaineDisponibilite()
      const rendezVousMilo = await firstValueFrom(
        this.httpService.get<RendezVousMiloDto>(
          `${this.apiUrl}/operateurs/dossiers/${evenement.idPartenaireBeneficiaire}/rdv/${evenement.idObjet}`,
          {
            headers: {
              'X-Gravitee-Api-Key': `${this.apiKeyDetailRendezVous}`,
              operateur: 'applicationcej'
            }
          }
        )
      )

      return {
        id: rendezVousMilo.data.id.toString(),
        dateHeureDebut: rendezVousMilo.data.dateHeureDebut,
        dateHeureFin: rendezVousMilo.data.dateHeureFin,
        titre: rendezVousMilo.data.objet,
        idPartenaireBeneficiaire: rendezVousMilo.data.idDossier.toString(),
        commentaire: rendezVousMilo.data.commentaire,
        adresse: rendezVousMilo.data.lieu,
        statut: rendezVousMilo.data.statut
      }
    } catch (e) {
      if (e.response?.status === HttpStatus.NOT_FOUND) {
        return undefined
      }
      throw e
    }
  }
}
