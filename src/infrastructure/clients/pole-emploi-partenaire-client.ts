import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'https'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Demarche } from '../../domain/demarche'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import {
  DemarcheDto,
  PrestationDto,
  RendezVousPoleEmploiDto,
  toEtat
} from './dto/pole-emploi.dto'

const ORIGINE = 'INDIVIDU'
const DEMARCHES_URL = 'peconnect-demarches/v1/demarches'

@Injectable()
export class PoleEmploiPartenaireClient {
  private readonly apiUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.logger = new Logger('PoleEmploiPartenaireClient')
    this.apiUrl = this.configService.get('poleEmploiPartenaire').url
  }

  async getDemarches(tokenDuJeune: string): Promise<DemarcheDto[]> {
    this.logger.log('recuperation des demarches du jeune')

    const response = await this.get<DemarcheDto[]>(DEMARCHES_URL, tokenDuJeune)

    if (response.status === HttpStatus.NO_CONTENT) {
      return []
    }

    return response.data ?? []
  }

  async getRendezVous(
    tokenDuJeune: string
  ): Promise<AxiosResponse<RendezVousPoleEmploiDto[]>> {
    this.logger.log('recuperation des rendez-vous du jeune')
    return this.get(
      'peconnect-rendezvousagenda/v1/listerendezvous',
      tokenDuJeune
    )
  }

  async getPrestations(
    tokenDuJeune: string,
    dateRechercheRendezVous: DateTime
  ): Promise<AxiosResponse<PrestationDto[]>> {
    this.logger.log(
      `recuperation des prestations du jeune à partir de la date du ${dateRechercheRendezVous.toFormat(
        'yyyy-MM-dd'
      )}`
    )
    const params = new URLSearchParams()
    params.append(
      'dateRecherche',
      dateRechercheRendezVous.toFormat('yyyy-MM-dd')
    )

    return this.get(
      'peconnect-gerer-prestations/v1/rendez-vous',
      tokenDuJeune,
      params
    )
  }

  async getLienVisio(
    tokenDuJeune: string,
    idVisio: string
  ): Promise<AxiosResponse<string>> {
    this.logger.log('recuperation visio')

    return this.get(
      `peconnect-gerer-prestations/v1/lien-visio/rendez-vous/${idVisio}`,
      tokenDuJeune
    )
  }

  async updateDemarche(
    demarcheModifiee: Demarche.Modifiee,
    token: string
  ): Promise<Result<DemarcheDto>> {
    try {
      const body = {
        id: demarcheModifiee.id,
        dateModification: demarcheModifiee.dateModification.toISO({
          includeOffset: false
        }),
        origineModificateur: ORIGINE,
        etat: toEtat(demarcheModifiee.statut),
        dateDebut:
          demarcheModifiee.dateDebut === null
            ? null
            : demarcheModifiee.dateDebut?.toISO({ includeOffset: false }),
        dateFin: demarcheModifiee.dateFin?.toISO({ includeOffset: false }),
        dateAnnulation: demarcheModifiee.dateAnnulation?.toISO({
          includeOffset: false
        })
      }
      const demarcheDto = await this.put<DemarcheDto>(
        `${DEMARCHES_URL}/${demarcheModifiee.id}`,
        token,
        body
      )
      return success(demarcheDto.data)
    } catch (e) {
      this.logger.error(e)
      if (e.response?.data && e.response?.status) {
        const erreur = new ErreurHttp(e.response.data, e.response.status)
        return failure(erreur)
      }
      throw e
    }
  }

  async createDemarche(
    demarche: Demarche.Creee,
    token: string
  ): Promise<Result<DemarcheDto>> {
    try {
      const body = {
        origineCreateur: ORIGINE,
        etat: toEtat(demarche.statut),
        dateCreation: demarche.dateCreation.toISO({
          includeOffset: false
        }),
        dateDebut: demarche.dateDebut.toISO({ includeOffset: false }),
        dateFin: demarche.dateFin.toISO({ includeOffset: false }),
        pourquoi: demarche.pourquoi,
        quoi: demarche.quoi,
        description: demarche.description
      }
      const demarcheDto = await this.post<DemarcheDto>(
        DEMARCHES_URL,
        token,
        body
      )
      return success(demarcheDto.data)
    } catch (e) {
      this.logger.error(e)
      if (e.response?.data && e.response?.status) {
        const erreur = new ErreurHttp(e.response.data, e.response.status)
        return failure(erreur)
      }
      throw e
    }
  }

  private get<T>(
    suffixUrl: string,
    tokenDuJeune: string,
    params?: URLSearchParams
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.get<T>(`${this.apiUrl}/${suffixUrl}`, {
        params,
        headers: { Authorization: `Bearer ${tokenDuJeune}` },
        httpsAgent:
          this.configService.get('environment') !== 'prod'
            ? new https.Agent({
                rejectUnauthorized: false
              })
            : undefined
      })
    )
  }

  private put<T>(
    suffixUrl: string,
    tokenDuJeune: string,
    body: object
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.put<T>(`${this.apiUrl}/${suffixUrl}`, body, {
        headers: { Authorization: `Bearer ${tokenDuJeune}` },
        httpsAgent:
          this.configService.get('environment') !== 'prod'
            ? new https.Agent({
                rejectUnauthorized: false
              })
            : undefined
      })
    )
  }

  private post<T>(
    suffixUrl: string,
    tokenDuJeune: string,
    body: object
  ): Promise<AxiosResponse<T>> {
    return firstValueFrom(
      this.httpService.post<T>(`${this.apiUrl}/${suffixUrl}`, body, {
        headers: { Authorization: `Bearer ${tokenDuJeune}` },
        httpsAgent:
          this.configService.get('environment') !== 'prod'
            ? new https.Agent({
                rejectUnauthorized: false
              })
            : undefined
      })
    )
  }
}
