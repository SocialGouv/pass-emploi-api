import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'https'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { Op } from 'sequelize'
import {
  AppelPartenaireResultat,
  Context,
  ContextKey
} from '../../building-blocks/context'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../building-blocks/types/result'
import {
  ResultApi,
  failureApi,
  isSuccessApi,
  successApi
} from '../../building-blocks/types/result-api'
import { Authentification } from '../../domain/authentification'
import { Demarche } from '../../domain/demarche'
import { suggestionsPEInMemory } from '../repositories/dto/pole-emploi.in-memory.dto'
import { LogApiPartenaireSqlModel } from '../sequelize/models/log-api-partenaire.sql-model'
import {
  DemarcheDto,
  DocumentPoleEmploiDto,
  PrestationDto,
  RendezVousPoleEmploiDto,
  SuggestionDto,
  toEtat
} from './dto/pole-emploi.dto'
import { handleAxiosError } from './utils/axios-error-handler'

const ORIGINE = 'INDIVIDU'
const DEMARCHES_URL = 'peconnect-demarches/v1/demarches'

export const PoleEmploiPartenaireClientToken = 'PoleEmploiPartenaireClientToken'

interface PoleEmploiPartenaireClientI {
  getDemarches(tokenDuJeune: string): Promise<ResultApi<DemarcheDto[]>>

  getRendezVous(
    tokenDuJeune: string
  ): Promise<ResultApi<RendezVousPoleEmploiDto[]>>

  getPrestations(
    tokenDuJeune: string,
    dateRechercheRendezVous: DateTime
  ): Promise<ResultApi<PrestationDto[]>>

  getLienVisio(
    tokenDuJeune: string,
    idVisio: string
  ): Promise<ResultApi<string>>

  getDocuments(
    tokenDuJeune: string
  ): Promise<Result<DocumentPoleEmploiDto[] | void>>

  updateDemarche(
    demarcheModifiee: Demarche.Modifiee,
    token: string
  ): Promise<Result<DemarcheDto>>

  createDemarche(
    demarche: Demarche.Creee,
    token: string
  ): Promise<Result<DemarcheDto>>

  getSuggestionsRecherches(token: string): Promise<ResultApi<SuggestionDto[]>>
}

@Injectable()
export class PoleEmploiPartenaireClient implements PoleEmploiPartenaireClientI {
  private readonly apiUrl: string
  private logger: Logger

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private context: Context
  ) {
    this.logger = new Logger('PoleEmploiPartenaireClient')
    this.apiUrl = this.configService.get('poleEmploi').url
  }

  async getDemarches(tokenDuJeune: string): Promise<ResultApi<DemarcheDto[]>> {
    this.logger.log('recuperation des demarches du jeune')

    const response = await this.getWithCache<DemarcheDto[]>(
      DEMARCHES_URL,
      tokenDuJeune
    )

    if (isSuccessApi(response) && !response.data) {
      return successApi([])
    }

    return response
  }

  async getRendezVous(
    tokenDuJeune: string
  ): Promise<ResultApi<RendezVousPoleEmploiDto[]>> {
    this.logger.log('recuperation des rendez-vous du jeune')
    return this.getWithCache<RendezVousPoleEmploiDto[]>(
      'peconnect-rendezvousagenda/v1/listerendezvous',
      tokenDuJeune
    )
  }

  async getPrestations(
    tokenDuJeune: string,
    dateRechercheRendezVous: DateTime
  ): Promise<ResultApi<PrestationDto[]>> {
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

    return this.getWithCache<PrestationDto[]>(
      'peconnect-gerer-prestations/v1/rendez-vous',
      tokenDuJeune,
      params
    )
  }

  async getLienVisio(
    tokenDuJeune: string,
    idVisio: string
  ): Promise<ResultApi<string>> {
    this.logger.log('recuperation visio')

    return this.getWithCache<string>(
      `peconnect-gerer-prestations/v1/lien-visio/rendez-vous/${idVisio}`,
      tokenDuJeune
    )
  }

  async getDocuments(
    tokenDuJeune: string
  ): Promise<Result<DocumentPoleEmploiDto[]>> {
    try {
      this.logger.log('Récupération des documents du jeune')
      const response = await this.get<DocumentPoleEmploiDto[]>(
        'peconnect-telecharger-cv-realisation/v1/piecesjointes',
        tokenDuJeune
      )
      return success(response.data ? response.data : [])
    } catch (e) {
      return handleAxiosError(
        e,
        this.logger,
        'La récupération des documents a échoué'
      )
    }
  }

  async updateDemarche(
    demarcheModifiee: Demarche.Modifiee,
    token: string
  ): Promise<Result<DemarcheDto>> {
    try {
      const body = {
        id: demarcheModifiee.id,
        dateModification: demarcheModifiee.dateModification.toUTC().toISO(),
        origineModification: ORIGINE,
        etat: toEtat(demarcheModifiee.statut),
        dateDebut: demarcheModifiee.dateDebut
          ? demarcheModifiee.dateDebut?.toUTC().toISO()
          : undefined,
        dateFin: demarcheModifiee.dateFin?.toUTC().toISO(),
        dateAnnulation: demarcheModifiee.dateAnnulation?.toUTC().toISO()
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
        dateCreation: demarche.dateCreation.toUTC().toISO(),
        dateFin: demarche.dateFin.toUTC().toISO(),
        pourquoi: demarche.pourquoi,
        quoi: demarche.quoi,
        comment: demarche.comment,
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

  async getSuggestionsRecherches(
    token: string
  ): Promise<ResultApi<SuggestionDto[]>> {
    return this.getWithCache<SuggestionDto[]>(
      'peconnect-metiersrecherches/v1/metiersrecherches',
      token
    )
  }

  private async get<T>(
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

  private async getWithCache<T>(
    suffixUrl: string,
    tokenDuJeune: string,
    params?: URLSearchParams
  ): Promise<ResultApi<T>> {
    try {
      const res = await this.get<T>(suffixUrl, tokenDuJeune, params)
      this.ajouterLeRetourAuContexteNode(res)
      return success(res.data)
    } catch (e) {
      if (!e.response || e.response.status === 500) {
        const cache = await this.recupererLesDernieresDonnees(suffixUrl)
        if (cache) {
          this.logger.warn(
            `Utilisation du cache pour ${suffixUrl} avec le log ${cache.id}`
          )
          return successApi(
            cache.resultatPartenaire as T,
            DateTime.fromJSDate(cache.date)
          )
        }
      }

      if (e.response) {
        return failureApi(new ErreurHttp(e.response.data, e.response.status))
      }
      throw e
    }
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
        headers: {
          Authorization: `Bearer ${tokenDuJeune}`,
          'Content-Type': 'application/json;charset=utf-8'
        },
        httpsAgent:
          this.configService.get('environment') !== 'prod'
            ? new https.Agent({
                rejectUnauthorized: false
              })
            : undefined
      })
    )
  }

  private ajouterLeRetourAuContexteNode<T>(res: AxiosResponse<T>): void {
    let resultatsAppelPartenaire: AppelPartenaireResultat[] = this.context.get<
      AppelPartenaireResultat[]
    >(ContextKey.RESULTATS_APPEL_PARTENAIRE) as AppelPartenaireResultat[]
    if (!resultatsAppelPartenaire) {
      resultatsAppelPartenaire = []
    }
    resultatsAppelPartenaire.push({
      resultat: res.data,
      path: res.request.path
    } as AppelPartenaireResultat)
    this.context.set(
      ContextKey.RESULTATS_APPEL_PARTENAIRE,
      resultatsAppelPartenaire
    )
  }

  private async recupererLesDernieresDonnees(
    suffixUrl: string
  ): Promise<LogApiPartenaireSqlModel | null> {
    const utilisateur = this.context.get<Authentification.Utilisateur>(
      ContextKey.UTILISATEUR
    )
    return LogApiPartenaireSqlModel.findOne({
      where: {
        pathPartenaire: {
          [Op.like]: `%${suffixUrl}%`
        },
        idUtilisateur: utilisateur.id
      },
      order: [['date', 'DESC']]
    })
  }
}

@Injectable()
export class PoleEmploiPartenaireInMemoryClient extends PoleEmploiPartenaireClient {
  async getSuggestionsRecherches(
    _token: string
  ): Promise<ResultApi<SuggestionDto[]>> {
    return success(suggestionsPEInMemory)
  }
}
