import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'https'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'

export interface PrestationDto {
  annule?: boolean
  datefin?: Date
  identifiantStable?: string
  session: {
    dateDebut: Date
    dateFinPrevue?: Date
    dateLimite?: Date
    enAgence?: boolean
    infoCollective?: boolean
    natureAnimation?: 'INTERNE' | 'EXTERNE' | 'CO_ANIMEE'
    realiteVirtuelle?: boolean
    modalitePremierRendezVous?: 'WEBCAM' | 'PHYSIQUE'
    adresse?: {
      adresseLigne1?: string
      adresseLigne2?: string
      adresseLigne3?: string
      codeInsee?: string
      codePostal?: string
      telephone?: string
      typeLieu?: 'INTERNE' | 'EXTERNE' | 'AUTRE'
      ville?: string
      villePostale?: string
      coordonneesGPS?: {
        latitude?: number
        longitude?: number
      }
      identifiantAurore?: string
    }
    duree: {
      unite: 'JOUR' | 'HEURE'
      valeur: number
    }
    typePrestation?: {
      code?: string
      libelle?: string
      accroche?: string
      actif?: boolean
      descriptifTypePrestation?: string
    }
    themeAtelier?: {
      libelle?: string
      accroche?: string
      code?: string
      codeTypePrestation?: string
    }
    sousThemeAtelier?: {
      codeSousThemeAtelier?: string
      libelleSousThemeAtelier?: string
      descriptifSousThemeAtelier?: string
    }
    dureeReunionInformationCollective?: {
      unite?: string
      valeur?: number
    }
    reunionInfoCommentaire?: string
    commentaire?: string
  }
}

export interface RendezVousPoleEmploiDto {
  theme?: string
  date: Date
  heure: string
  duree: number
  modaliteContact?: 'VISIO' | 'TELEPHONIQUE' | 'AGENCE'
  nomConseiller?: string
  prenomConseiller?: string
  agence?: string
  adresse?: {
    bureauDistributeur?: string
    ligne4?: string
    ligne5?: string
    ligne6?: string
  }
  commentaire?: string
  typeRDV?: 'RDVL' | 'CONVOCATION'
  lienVisio?: string
}

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

  async getRendezVous(
    tokenDuJeune: string
  ): Promise<AxiosResponse<RendezVousPoleEmploiDto[]>> {
    this.logger.log(
      `recuperation des rendez-vous du jeune'
      )}`
    )
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

  private get(
    suffixUrl: string,
    tokenDuJeune: string,
    params?: URLSearchParams
  ): Promise<AxiosResponse> {
    return firstValueFrom(
      this.httpService.get(`${this.apiUrl}/${suffixUrl}`, {
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
}
