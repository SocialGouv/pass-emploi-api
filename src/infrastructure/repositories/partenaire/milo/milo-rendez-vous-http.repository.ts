import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import {
  emptySuccess,
  failure,
  Result
} from '../../../../building-blocks/types/result'
import {
  EvenementMiloDto,
  RendezVousMiloDto,
  SessionMiloDto
} from '../../dto/milo.dto'
import { MiloRendezVous } from '../../../../domain/partenaire/milo/milo.rendez-vous'
import { RateLimiterService } from '../../../../utils/rate-limiter.service'

@Injectable()
export class MiloRendezVousHttpRepository implements MiloRendezVous.Repository {
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

  async findAllEvenements(): Promise<MiloRendezVous.Evenement[]> {
    await this.rateLimiterService.getEvenementMilo.attendreLaProchaineDisponibilite()
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
    evenement: MiloRendezVous.Evenement
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
      return failure(e)
    }
  }

  async findRendezVousByEvenement(
    evenement: MiloRendezVous.Evenement
  ): Promise<MiloRendezVous | undefined> {
    try {
      if (evenement.objet === MiloRendezVous.ObjetEvenement.SESSION) {
        await this.rateLimiterService.getSessionMilo.attendreLaProchaineDisponibilite()
        const sessionMilo = await firstValueFrom(
          this.httpService.get<SessionMiloDto>(
            `${this.apiUrl}/operateurs/dossiers/${evenement.idPartenaireBeneficiaire}/sessions/${evenement.idObjet}`,
            {
              headers: {
                'X-Gravitee-Api-Key': `${this.apiKeyDetailRendezVous}`,
                operateur: 'applicationcej'
              }
            }
          )
        )

        if (['Refus tiers', 'Refus jeune'].includes(sessionMilo.data.statut)) {
          return undefined
        }

        return {
          id: sessionMilo.data.id,
          dateHeureDebut: sessionMilo.data.dateHeureDebut,
          dateHeureFin: sessionMilo.data.dateHeureFin,
          titre: sessionMilo.data.nom,
          idPartenaireBeneficiaire: sessionMilo.data.idDossier,
          commentaire: sessionMilo.data.commentaire,
          statut: sessionMilo.data.statut,
          type: MiloRendezVous.Type.SESSION,
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

        if (['Annulé', 'Reporté'].includes(rendezVousMilo.data.statut)) {
          return undefined
        }

        return {
          id: rendezVousMilo.data.id.toString(),
          dateHeureDebut: rendezVousMilo.data.dateHeureDebut,
          dateHeureFin: rendezVousMilo.data.dateHeureFin,
          titre: rendezVousMilo.data.objet,
          idPartenaireBeneficiaire: rendezVousMilo.data.idDossier.toString(),
          commentaire: rendezVousMilo.data.commentaire,
          type: MiloRendezVous.Type.RENDEZ_VOUS,
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
): MiloRendezVous.ObjetEvenement {
  switch (type) {
    case 'RDV':
      return MiloRendezVous.ObjetEvenement.RENDEZ_VOUS
    case 'SESSION':
      return MiloRendezVous.ObjetEvenement.SESSION
    default:
      return MiloRendezVous.ObjetEvenement.NON_TRAITABLE
  }
}

function actionToType(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string
): MiloRendezVous.TypeEvenement {
  switch (action) {
    case 'CREATE':
      return MiloRendezVous.TypeEvenement.CREATE
    case 'UPDATE':
      return MiloRendezVous.TypeEvenement.UPDATE
    case 'DELETE':
      return MiloRendezVous.TypeEvenement.DELETE
    default:
      return MiloRendezVous.TypeEvenement.NON_TRAITABLE
  }
}
