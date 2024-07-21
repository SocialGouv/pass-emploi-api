import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../../building-blocks/types/result'
import { EvenementMilo } from '../../../domain/milo/evenement.milo'
import { RateLimiterService } from '../../../utils/rate-limiter.service'
import { EvenementMiloDto } from '../dto/milo.dto'

@Injectable()
export class EvenementMiloHttpRepository implements EvenementMilo.Repository {
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKeyEvents: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private rateLimiterService: RateLimiterService
  ) {
    this.logger = new Logger('EvenementMiloHttpRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyEvents = this.configService.get('milo').apiKeyEvents
  }

  async findAllEvenements(): Promise<EvenementMilo[]> {
    await this.rateLimiterService.evenementsMiloRateLimiter.attendreLaProchaineDisponibilite()

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
        action: toActionEvenement(evenement.action),
        objet: toObjetEvenement(evenement.type),
        idObjet: evenement.idType?.toString() ?? null,
        idPartenaireBeneficiaire: evenement.idDossier.toString()
      }
    })
  }

  async acquitterEvenement(evenement: EvenementMilo): Promise<Result> {
    try {
      await this.rateLimiterService.evenementsMiloRateLimiter.attendreLaProchaineDisponibilite()
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
}

function toObjetEvenement(
  typeMilo: 'RDV' | 'SESSION' | string
): EvenementMilo.ObjetEvenement {
  switch (typeMilo) {
    case 'RDV':
      return EvenementMilo.ObjetEvenement.RENDEZ_VOUS
    case 'SESSION':
      return EvenementMilo.ObjetEvenement.SESSION
    default:
      return EvenementMilo.ObjetEvenement.NON_TRAITABLE
  }
}

function toActionEvenement(
  actionMilo: 'CREATE' | 'UPDATE' | 'DELETE' | string
): EvenementMilo.ActionEvenement {
  switch (actionMilo) {
    case 'CREATE':
      return EvenementMilo.ActionEvenement.CREATE
    case 'UPDATE':
      return EvenementMilo.ActionEvenement.UPDATE
    case 'DELETE':
      return EvenementMilo.ActionEvenement.DELETE
    default:
      return EvenementMilo.ActionEvenement.NON_TRAITABLE
  }
}
