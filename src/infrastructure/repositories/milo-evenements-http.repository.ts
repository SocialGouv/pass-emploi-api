import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { Partenaire } from 'src/domain/partenaire/partenaire'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import {
  EvenementMiloDto,
  RendezVousMiloDto,
  SessionMiloDto
} from './dto/milo.dto'

@Injectable()
export class MiloEvenementsHttpRepository
  implements Partenaire.Milo.Repository
{
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKeyEvents: string
  private readonly apiKeyDetailRendezVous: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MiloHttpRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyEvents = this.configService.get('milo').apiKeyEvents
    this.apiKeyDetailRendezVous =
      this.configService.get('milo').apiKeyDetailRendezVous
  }

  async findAllEvenements(): Promise<Partenaire.Milo.Evenement[]> {
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
        idObjet: evenement.idType,
        idPartenaireBeneficiaire: evenement.idDossier
      }
    })
  }

  async acquitterEvenement(
    evenement: Partenaire.Milo.Evenement
  ): Promise<Result> {
    try {
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
      return failure(new ErreurHttp(e.response.data, e.response.status))
    }
  }

  async findRendezVousByEvenement(
    evenement: Partenaire.Milo.Evenement
  ): Promise<Partenaire.Milo.RendezVous | undefined> {
    try {
      if (evenement.objet === Partenaire.Milo.ObjetEvenement.SESSION) {
        const sessionMilo = await firstValueFrom(
          this.httpService.get<SessionMiloDto>(
            `${this.apiUrl}/operateurs/dossiers/${evenement.idPartenaireBeneficiaire}/sessions/${evenement.idObjet}`,
            {
              headers: {
                'X-Gravitee-Api-Key': `${this.apiKeyEvents}`,
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
          type: Partenaire.Milo.RendezVous.Type.SESSION,
          adresse: sessionMilo.data.lieu
        }
      } else {
        const rendezVousMilo = await firstValueFrom(
          this.httpService.get<RendezVousMiloDto>(
            `${this.apiUrl}/operateurs/dossiers/${evenement.idPartenaireBeneficiaire}/rdv/${evenement.idObjet}`,
            {
              headers: {
                'X-Gravitee-Api-Key': `${this.apiKeyEvents}`,
                operateur: 'applicationcej'
              }
            }
          )
        )

        if (['Annulé', 'Reporté'].includes(rendezVousMilo.data.statut)) {
          return undefined
        }

        return {
          id: rendezVousMilo.data.id,
          dateHeureDebut: rendezVousMilo.data.dateHeureDebut,
          dateHeureFin: rendezVousMilo.data.dateHeureFin,
          titre: rendezVousMilo.data.objet,
          idPartenaireBeneficiaire: rendezVousMilo.data.idDossier,
          commentaire: rendezVousMilo.data.commentaire,
          type: Partenaire.Milo.RendezVous.Type.RENDEZ_VOUS,
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
): Partenaire.Milo.ObjetEvenement {
  switch (type) {
    case 'RDV':
      return Partenaire.Milo.ObjetEvenement.RENDEZ_VOUS
    case 'SESSION':
      return Partenaire.Milo.ObjetEvenement.SESSION
    default:
      return Partenaire.Milo.ObjetEvenement.NON_TRAITABLE
  }
}

function actionToType(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string
): Partenaire.Milo.TypeEvenement {
  switch (action) {
    case 'CREATE':
      return Partenaire.Milo.TypeEvenement.CREATE
    case 'UPDATE':
      return Partenaire.Milo.TypeEvenement.UPDATE
    case 'DELETE':
      return Partenaire.Milo.TypeEvenement.DELETE
    default:
      return Partenaire.Milo.TypeEvenement.NON_TRAITABLE
  }
}
