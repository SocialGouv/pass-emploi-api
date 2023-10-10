import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../../building-blocks/types/result'
import { RendezVousMilo } from '../../../domain/milo/rendez-vous.milo'
import { RateLimiterService } from '../../../utils/rate-limiter.service'
import {
  EvenementMiloDto,
  RendezVousMiloDto,
  InstanceSessionMiloDto
} from '../dto/milo.dto'

@Injectable()
export class MiloRendezVousHttpRepository implements RendezVousMilo.Repository {
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKeyEvents: string
  private readonly apiKeyDetailRendezVous: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService
  ) {
    this.logger = new Logger('MiloHttpRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyEvents = this.configService.get('milo').apiKeyEvents
    this.apiKeyDetailRendezVous =
      this.configService.get('milo').apiKeyDetailRendezVous
  }

  async findAllEvenements(): Promise<RendezVousMilo.Evenement[]> {
    await this.rateLimiterService.getEvenementMilo.attendreLaProchaineDisponibilite()

    this.logger.log("Appel de l'api i-milo findAllEvenements")
    const evenements = await firstValueFrom(
      this.httpService.get<EvenementMiloDto[]>(
        `${this.apiUrl}/operateurs/events`,
        {
          headers: { 'X-Gravitee-Api-Key': `${this.apiKeyEvents}` }
        }
      )
    )
    return evenements.data.map(evenement => {
      return {
        id: evenement.identifiant,
        date: evenement.date,
        type: actionToType(evenement.action),
        objet: typeToObjet(evenement.type),
        idObjet: evenement.idType.toString(),
        idPartenaireBeneficiaire: evenement.idDossier.toString()
      }
    })
  }

  async acquitterEvenement(
    evenement: RendezVousMilo.Evenement
  ): Promise<Result> {
    try {
      await this.rateLimiterService.getEvenementMilo.attendreLaProchaineDisponibilite()
      await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/operateurs/events/${evenement.id}/ack`,
          {},
          {
            headers: { 'X-Gravitee-Api-Key': `${this.apiKeyEvents}` }
          }
        )
      )
      return emptySuccess()
    } catch (e) {
      this.logger.error(e)
      if (e.response) {
        return failure(new ErreurHttp(e.response.data, e.response.status))
      }
      return failure(e)
    }
  }

  async findRendezVousByEvenement(
    evenement: RendezVousMilo.Evenement
  ): Promise<RendezVousMilo | undefined> {
    try {
      if (evenement.objet === RendezVousMilo.ObjetEvenement.SESSION) {
        await this.rateLimiterService.getSessionMilo.attendreLaProchaineDisponibilite()
        const sessionMilo = await firstValueFrom(
          this.httpService.get<InstanceSessionMiloDto>(
            `${this.apiUrl}/operateurs/dossiers/${evenement.idPartenaireBeneficiaire}/sessions/${evenement.idObjet}`,
            {
              headers: {
                'X-Gravitee-Api-Key': `${this.apiKeyDetailRendezVous}`,
                operateur: 'applicationcej'
              }
            }
          )
        )

        return {
          id: sessionMilo.data.idSession,
          dateHeureDebut: sessionMilo.data.dateHeureDebut,
          dateHeureFin: sessionMilo.data.dateHeureFin,
          titre: sessionMilo.data.nom,
          idPartenaireBeneficiaire: sessionMilo.data.idDossier,
          commentaire: sessionMilo.data.commentaire,
          statut: sessionMilo.data.statut,
          type: RendezVousMilo.Type.SESSION,
          adresse: sessionMilo.data.lieu
        }
      } else {
        await this.rateLimiterService.getRendezVousMilo.attendreLaProchaineDisponibilite()
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
          type: RendezVousMilo.Type.RENDEZ_VOUS,
          statut: rendezVousMilo.data.statut
        }
      }
    } catch (e) {
      if (e.response?.status === HttpStatus.NOT_FOUND) {
        return undefined
      }
      throw e
    }
  }
}

function typeToObjet(
  type: 'RDV' | 'SESSION' | string
): RendezVousMilo.ObjetEvenement {
  switch (type) {
    case 'RDV':
      return RendezVousMilo.ObjetEvenement.RENDEZ_VOUS
    case 'SESSION':
      return RendezVousMilo.ObjetEvenement.SESSION
    default:
      return RendezVousMilo.ObjetEvenement.NON_TRAITABLE
  }
}

function actionToType(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string
): RendezVousMilo.TypeEvenement {
  switch (action) {
    case 'CREATE':
      return RendezVousMilo.TypeEvenement.CREATE
    case 'UPDATE':
      return RendezVousMilo.TypeEvenement.UPDATE
    case 'DELETE':
      return RendezVousMilo.TypeEvenement.DELETE
    default:
      return RendezVousMilo.TypeEvenement.NON_TRAITABLE
  }
}
