import { HttpService } from '@nestjs/axios'
import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import * as https from 'https'
import { DateTime } from 'luxon'
import { firstValueFrom } from 'rxjs'

export interface PrestationDto {
  annule?: boolean
  datefin?: string
  identifiantStable?: string
  session: {
    dateDebut: string
    dateFinPrevue?: string
    dateLimite?: string
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
      descriptif?: string
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
  date: string
  heure: string
  duree: number
  modaliteContact?: 'VISIO' | 'TELEPHONIQUE' | 'TELEPHONE' | 'AGENCE'
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

export interface DemarcheDto {
  id?: string
  etat: 'AC' | 'RE' | 'AN' | 'EC' | 'AF'
  dateDebut?: string
  dateFin: string
  dateAnnulation?: string
  dateCreation: string
  dateModification?: string
  origineCreateur: 'INDIVIDU' | 'CONSEILLER' | 'PARTENAIRE' | 'ENTREPRISE'
  origineModificateur?: 'INDIVIDU' | 'CONSEILLER' | 'PARTENAIRE' | 'ENTREPRISE'
  origineDemarche:
    | 'ACTION'
    | 'ACTUALISATION'
    | 'CANDIDATURE'
    | 'JRE_CONSEILLER'
    | 'JRE_DE'
    | 'CV'
    | 'LM'
    | 'PUBLICATION_PROFIL'
    | 'ENTRETIEN'
    | 'RECHERCHE_ENREGISTREE'
    | 'SUGGESTION'
    | 'PASS_EMPLOI'
  pourquoi: string
  libellePourquoi: string
  quoi: string
  libelleQuoi: string
  comment?: string
  libelleComment?: string
  libelleLong?: string
  libelleCourt?: string
  ou?: string
  description?: string
  organisme?: string
  metier?: string
  nombre?: string
  contact?: string
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

  async getDemarches(tokenDuJeune: string): Promise<DemarcheDto[]> {
    this.logger.log('recuperation des demarches du jeune')

    const response = await this.get(
      'peconnect-demarches/v1/demarches',
      tokenDuJeune
    )

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
