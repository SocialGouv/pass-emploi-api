import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'https'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'
import { QueryTypes, Sequelize } from 'sequelize'
import { v4 as uuidV4 } from 'uuid'
import { Context, ContextKey } from '../../building-blocks/context'
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
import { buildError } from '../../utils/logger.module'
import { getAPMInstance } from '../monitoring/apm.init'
import { suggestionsPEInMemory } from '../repositories/dto/pole-emploi.in-memory.dto'
import { CacheApiPartenaireSqlModel } from '../sequelize/models/cache-api-partenaire.sql-model'
import { SequelizeInjectionToken } from '../sequelize/providers'
import {
  DemarcheDto,
  DocumentPoleEmploiDto,
  PrestationDto,
  RendezVousPoleEmploiDto,
  SuggestionDto,
  ThematiqueDto,
  toEtat
} from './dto/pole-emploi.dto'
import { handleAxiosError } from './utils/axios-error-handler'

const ORIGINE = 'INDIVIDU'
const DEMARCHES_URL = 'peconnect-demarches/v1/demarches'

export const PoleEmploiPartenaireClientToken = 'PoleEmploiPartenaireClientToken'

interface PoleEmploiPartenaireClientI {
  getDemarches(
    tokenDuJeune: string,
    idJeune?: string
  ): Promise<ResultApi<DemarcheDto[]>>
  getDemarchesEnCache(idJeune: string): Promise<ResultApi<DemarcheDto[]>>

  getRendezVous(
    tokenDuJeune: string,
    dateDebut: DateTime
  ): Promise<ResultApi<RendezVousPoleEmploiDto[]>>

  getPrestations(
    tokenDuJeune: string,
    dateRechercheRendezVous: DateTime
  ): Promise<ResultApi<PrestationDto[]>>

  getLienVisio(tokenDuJeune: string, idVisio: string): Promise<Result<string>>

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
    private context: Context,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    this.logger = new Logger('PoleEmploiPartenaireClient')
    this.apiUrl = this.configService.get('poleEmploi').url
  }

  async getDemarches(
    tokenDuJeune: string,
    idJeune?: string
  ): Promise<ResultApi<DemarcheDto[]>> {
    this.logger.log('recuperation des demarches du jeune')

    try {
      const response = await this.getWithCache<DemarcheDto[]>(
        DEMARCHES_URL,
        tokenDuJeune,
        undefined,
        true,
        idJeune
      )

      if (isSuccessApi(response)) {
        if (!response.data || !response.data.length) return successApi([])
      }

      return response
    } catch (e) {
      this.logger.error(e)
      return successApi([])
    }
  }

  async getDemarchesEnCache(
    idJeune: string
  ): Promise<ResultApi<DemarcheDto[]>> {
    const cache = await this.recupererLesDernieresDonnees(
      appendCacheParam(DEMARCHES_URL, idJeune)
    )
    if (!cache)
      return failureApi(new ErreurHttp('Aucune démarche en cache', 404))

    return successApi(
      cache.resultatPartenaire as DemarcheDto[],
      DateTime.fromJSDate(cache.date)
    )
  }

  async getRendezVous(
    tokenDuJeune: string,
    dateDebut: DateTime
  ): Promise<ResultApi<RendezVousPoleEmploiDto[]>> {
    this.logger.log('recuperation des rendez-vous passés du jeune')
    const params = new URLSearchParams()
    params.append('dateDebut', dateDebut.toUTC().toISO())

    const response = await this.getWithCache<RendezVousPoleEmploiDto[]>(
      'peconnect-rendezvousagenda/v2/listerendezvous',
      tokenDuJeune,
      params,
      true
    )

    if (isSuccessApi(response)) {
      if (!response.data || !response.data.length) return successApi([])
    }
    return response
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
    params.append('dateRecherche', dateRechercheRendezVous.toISODate())

    const response = await this.getWithCache<PrestationDto[]>(
      'peconnect-gerer-prestations/v1/rendez-vous',
      tokenDuJeune,
      params,
      true
    )

    if (isSuccessApi(response)) {
      if (!response.data || !response.data.length) return successApi([])
    }
    return response
  }

  async getLienVisio(
    tokenDuJeune: string,
    idVisio: string
  ): Promise<Result<string>> {
    const reponse = await this.getWithRetry<string>(
      `peconnect-gerer-prestations/v1/lien-visio/rendez-vous/${idVisio}`,
      tokenDuJeune
    )
    return success(reponse.data)
  }

  async getDocuments(
    tokenDuJeune: string
  ): Promise<Result<DocumentPoleEmploiDto[]>> {
    try {
      this.logger.log('Récupération des documents du jeune')
      const result = await this.getWithCache<DocumentPoleEmploiDto[]>(
        'peconnect-telecharger-cv-realisation/v1/piecesjointes',
        tokenDuJeune,
        undefined,
        true
      )
      return success(isSuccessApi(result) && result.data ? result.data : [])
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
      token,
      undefined,
      true
    )
  }

  async getCatalogue(token: string): Promise<Result<ThematiqueDto[]>> {
    try {
      const response = await this.get<ThematiqueDto[]>(
        `peconnect-demarches/v1/referentiel/demarches`,
        token
      )
      return success(response.data)
    } catch (e) {
      return handleAxiosError(
        e,
        this.logger,
        `La récupération du catalogue de démarche a échoué`
      )
    }
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
  private async getWithRetry<T>(
    suffixUrl: string,
    tokenDuJeune: string,
    params?: URLSearchParams,
    secondesAAttendre?: number
  ): Promise<AxiosResponse<T>> {
    if (secondesAAttendre) {
      await new Promise(resolve =>
        setTimeout(resolve, secondesAAttendre * 1000)
      )
    }

    return this.get<T>(suffixUrl, tokenDuJeune, params)
      .then(res => res)
      .catch(e => {
        this.logger.error(e)

        const estLePremierRetry = secondesAAttendre === undefined
        if (
          e.response?.status === 429 &&
          estLePremierRetry &&
          e.response?.headers &&
          e.response?.headers['retry-after']
        ) {
          this.logger.log('Retry de la requête')
          return this.getWithRetry<T>(
            suffixUrl,
            tokenDuJeune,
            params,
            parseInt(e.response?.headers['retry-after'])
          )
        }

        throw e
      })
  }

  private async getWithCache<T>(
    suffixUrl: string,
    tokenDuJeune: string,
    params?: URLSearchParams,
    retry?: boolean,
    cacheParam?: string
  ): Promise<ResultApi<T>> {
    const cacheUrl = appendCacheParam(suffixUrl, cacheParam)

    try {
      let res
      if (retry) {
        res = await this.getWithRetry<T>(suffixUrl, tokenDuJeune, params)
      } else {
        res = await this.get<T>(suffixUrl, tokenDuJeune, params)
      }
      this.sauvegarderLeRetourEnCache(res, cacheUrl)
      return success(res.data)
    } catch (e) {
      if (!e.response || e.response.status > 401) {
        const cache = await this.recupererLesDernieresDonnees(cacheUrl)
        if (cache) {
          this.logger.warn(
            `Utilisation du cache pour ${suffixUrl} avec l'id ${cache.id}`
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
      this.logger.error(buildError('Erreur GET WITH CACHE FT', e))
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

  private async sauvegarderLeRetourEnCache<T>(
    res: AxiosResponse<T>,
    pathPartenaire: string
  ): Promise<void> {
    const utilisateur = this.context.get<Authentification.Utilisateur>(
      ContextKey.UTILISATEUR
    )!

    await this.sequelize
      .query(
        `
      INSERT INTO cache_api_partenaire (id, id_utilisateur, type_utilisateur, date, path_partenaire, resultat_partenaire, transaction_id)
      VALUES (:id, :idUtilisateur, :typeUtilisateur, :date, :pathPartenaire, :resultatPartenaire, :transactionId)
      ON CONFLICT (id_utilisateur, path_partenaire) 
      DO UPDATE SET date = :date, resultat_partenaire = :resultatPartenaire, transaction_id = :transactionId;
      `,
        {
          replacements: {
            id: uuidV4(),
            idUtilisateur: utilisateur.id,
            typeUtilisateur: utilisateur.type,
            date: new Date(),
            pathPartenaire,
            resultatPartenaire: JSON.stringify(res.data),
            transactionId:
              getAPMInstance().currentTraceIds['transaction.id'] || null
          },
          type: QueryTypes.INSERT
        }
      )
      .catch(e => {
        getAPMInstance().captureError(e)
        this.logger.error(e)
      })
  }

  private async recupererLesDernieresDonnees(
    pathPartenaire: string
  ): Promise<CacheApiPartenaireSqlModel | null> {
    const utilisateur = this.context.get<Authentification.Utilisateur>(
      ContextKey.UTILISATEUR
    )!
    return CacheApiPartenaireSqlModel.findOne({
      where: {
        pathPartenaire,
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

function appendCacheParam(path: string, cacheParam?: string): string {
  return path + (cacheParam ? '?cacheParam=' + cacheParam : '')
}
