import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Partenaire } from 'src/domain/partenaire/partenaire'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { firstValueFrom } from 'rxjs'
import { EvenementMiloDto } from './dto/milo.dto'
import { ErreurHttp } from '../../building-blocks/types/domain-error'

@Injectable()
export class MiloEvenementsHttpRepository
  implements Partenaire.Milo.Repository
{
  private logger: Logger
  private readonly apiUrl: string
  private readonly apiKeyEvents: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('MiloHttpRepository')
    this.apiUrl = this.configService.get('milo').url
    this.apiKeyEvents = this.configService.get('milo').apiKeyEvents
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
