import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from 'src/domain/rendez-vous'
import { PoleEmploiPrestationsClient } from 'src/infrastructure/clients/pole-emploi-prestations-client'
import { DateService } from 'src/utils/date-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetRendezVousJeunePoleEmploiQuery extends Query {
  idJeune: string
  idpToken: string
}

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

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryHandler extends QueryHandler<
  GetRendezVousJeunePoleEmploiQuery,
  Result<RendezVousQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private poleEmploiPrestationsClient: PoleEmploiPrestationsClient,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private dateService: DateService
  ) {
    super('GetRendezVousJeunePoleEmploiQueryHandler')
  }

  async handle(
    query: GetRendezVousJeunePoleEmploiQuery
  ): Promise<Result<RendezVousQueryModel[]>> {
    const jeune = await this.jeuneRepository.get(query.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', query.idJeune))
    }

    const maintenant = this.dateService.now()

    try {
      const responseRendezVous =
        await this.poleEmploiPrestationsClient.getRendezVous(
          query.idpToken,
          maintenant
        )

      const prestations: PrestationDto[] = responseRendezVous?.data ?? []

      const rendezVous = await Promise.all(
        prestations.map(async prestation => {
          const dateRendezVous = DateTime.fromJSDate(
            prestation.session.dateDebut
          )
          let lienVisio = undefined

          if (
            prestation.identifiantStable &&
            dateRendezVous.day === maintenant.day &&
            dateRendezVous.month === maintenant.month &&
            dateRendezVous.year === maintenant.year
          ) {
            const responseLienVisio =
              await this.poleEmploiPrestationsClient.getLienVisio(
                query.idpToken,
                prestation.identifiantStable
              )
            lienVisio = responseLienVisio?.data
          }

          return this.fromPrestationDtoToRendezVousQueryModel(
            prestation,
            jeune,
            lienVisio
          )
        })
      )
      return success(rendezVous)
    } catch (e) {
      this.logger.error(e)
      return failure(
        new ErreurHttp(e.response?.data?.message, e.response?.status)
      )
    }
  }

  async authorize(
    query: GetRendezVousJeunePoleEmploiQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeunePoleEmploiAuthorizer.authorize(query.idJeune, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }

  fromPrestationDtoToRendezVousQueryModel(
    prestation: PrestationDto,
    jeune: Jeune,
    lienVisio?: string
  ): RendezVousQueryModel {
    return {
      id: 'inconnu-prestation',
      title: '',
      type: {
        code: CodeTypeRendezVous.PRESTATION,
        label: mapCodeLabelTypeRendezVous[CodeTypeRendezVous.PRESTATION]
      },
      date: prestation.session.dateDebut,
      comment: prestation.session.commentaire,
      jeune: { id: jeune.id, nom: jeune.lastName, prenom: jeune.firstName },
      modality: buildModality(prestation),
      duration: buildDuration(prestation),
      description: buildDescription(prestation),
      adresse: buildAdresse(prestation),
      organisme: prestation.session.adresse?.adresseLigne3,
      agencePE: prestation.session.enAgence,
      theme: prestation.session.typePrestation?.libelle,
      telephone: prestation.session.adresse?.telephone,
      annule: prestation.annule,
      visio:
        prestation.session.natureAnimation === 'INTERNE' ||
        prestation.session.modalitePremierRendezVous === 'WEBCAM',
      lienVisio
    }
  }
}

function buildModality(prestation: PrestationDto): string {
  switch (prestation.session.modalitePremierRendezVous) {
    case 'WEBCAM':
      return 'par visio'
    case 'PHYSIQUE':
      return 'en présentiel'
    default:
      return ''
  }
}

function buildDescription(prestation: PrestationDto): string | undefined {
  switch (prestation.session.typePrestation?.code) {
    case 'ATE':
      return prestation.session.themeAtelier?.libelle
    case 'ATL':
    case 'ATC':
      return (
        [
          prestation.session.sousThemeAtelier?.libelleSousThemeAtelier,
          prestation.session.sousThemeAtelier?.descriptifSousThemeAtelier
        ]
          .join('\n')
          .trim() || undefined
      )
    default:
      return prestation.session.typePrestation?.descriptifTypePrestation
  }
}

function buildAdresse(prestation: PrestationDto): string | undefined {
  return (
    [
      prestation.session.adresse?.adresseLigne1,
      prestation.session.adresse?.adresseLigne2,
      prestation.session.adresse?.codePostal,
      prestation.session.adresse?.ville
    ]
      .join(' ')
      .trim() || undefined
  )
}

function buildDuration(prestation: PrestationDto): number {
  if (prestation.session.duree.unite === 'HEURE') {
    return Math.floor(prestation.session.duree.valeur * 60)
  }
  return 0
}
