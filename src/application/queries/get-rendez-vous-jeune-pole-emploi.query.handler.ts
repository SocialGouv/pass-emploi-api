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
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  PoleEmploiPartenaireClient,
  PrestationDto,
  RendezVousPoleEmploiDto
} from '../../infrastructure/clients/pole-emploi-partenaire-client'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { RendezVousQueryModel } from './query-models/rendez-vous.query-models'

export interface GetRendezVousJeunePoleEmploiQuery extends Query {
  idJeune: string
  idpToken: string
}

@Injectable()
export class GetRendezVousJeunePoleEmploiQueryHandler extends QueryHandler<
  GetRendezVousJeunePoleEmploiQuery,
  Result<RendezVousQueryModel[]>
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private dateService: DateService,
    private idService: IdService
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
      const [responsePrestationsRendezVous, responseRendezVousPoleEmploi] =
        await Promise.all([
          await this.poleEmploiPartenaireClient.getPrestations(
            query.idpToken,
            maintenant
          ),
          await this.poleEmploiPartenaireClient.getRendezVous(query.idpToken)
        ])

      const prestations: PrestationDto[] =
        responsePrestationsRendezVous?.data ?? []

      const rendezVousPoleEmploiDto: RendezVousPoleEmploiDto[] =
        responseRendezVousPoleEmploi?.data ?? []

      const rendezVousPrestations = await Promise.all(
        prestations.map(async prestation => {
          const dateRendezVous = DateTime.fromJSDate(
            prestation.session.dateDebut
          )
          let lienVisio = undefined

          if (
            prestation.identifiantStable &&
            this.dateService.isSameDateDay(dateRendezVous, maintenant)
          ) {
            const responseLienVisio =
              await this.poleEmploiPartenaireClient.getLienVisio(
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
      const rendezVousPoleEmploi = rendezVousPoleEmploiDto.map(rendezVous => {
        return this.fromRendezVousPoleEmploiDtoToRendezVousQueryModel(
          rendezVous,
          jeune
        )
      })

      return success(rendezVousPrestations.concat(rendezVousPoleEmploi))
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
      id: this.idService.uuid(),
      title: '',
      idStable: prestation.identifiantStable,
      type: {
        code: CodeTypeRendezVous.PRESTATION,
        label: mapCodeLabelTypeRendezVous[CodeTypeRendezVous.PRESTATION]
      },
      date: prestation.session.dateDebut,
      comment: prestation.session.commentaire,
      jeune: { id: jeune.id, nom: jeune.lastName, prenom: jeune.firstName },
      modality: buildPrestationModality(prestation),
      duration: buildPrestationDuration(prestation),
      description: buildPrestationDescription(prestation),
      adresse: buildPrestationAdresse(prestation),
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

  fromRendezVousPoleEmploiDtoToRendezVousQueryModel(
    rendezVousPoleEmploiDto: RendezVousPoleEmploiDto,
    jeune: Jeune
  ): RendezVousQueryModel {
    return {
      id: this.idService.uuid(),
      title: '',
      type: {
        code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
        label:
          mapCodeLabelTypeRendezVous[
            CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
          ]
      },
      date: buildRendezVousDate(rendezVousPoleEmploiDto),
      comment: rendezVousPoleEmploiDto.commentaire,
      jeune: { id: jeune.id, nom: jeune.lastName, prenom: jeune.firstName },
      modality: buildRendezVousModality(rendezVousPoleEmploiDto),
      duration: rendezVousPoleEmploiDto.duree,
      adresse: buildRendezVousAdresse(rendezVousPoleEmploiDto),
      agencePE: !!rendezVousPoleEmploiDto.agence,
      conseiller:
        rendezVousPoleEmploiDto.nomConseiller &&
        rendezVousPoleEmploiDto.prenomConseiller
          ? {
              id: this.idService.uuid(),
              nom: rendezVousPoleEmploiDto.nomConseiller,
              prenom: rendezVousPoleEmploiDto.prenomConseiller
            }
          : undefined,
      theme: rendezVousPoleEmploiDto.theme,
      presenceConseiller: true,
      visio: rendezVousPoleEmploiDto.modaliteContact === 'VISIO',
      lienVisio: rendezVousPoleEmploiDto.lienVisio
    }
  }
}

function buildPrestationModality(prestation: PrestationDto): string {
  switch (prestation.session.modalitePremierRendezVous) {
    case 'WEBCAM':
      return 'par visio'
    case 'PHYSIQUE':
      return 'en présentiel'
    default:
      return ''
  }
}

function buildPrestationDescription(
  prestation: PrestationDto
): string | undefined {
  switch (prestation.session.typePrestation?.code) {
    case 'ATE':
      return prestation.session.themeAtelier?.libelle
    case 'ATL':
    case 'ATC':
      const description = [
        prestation.session.sousThemeAtelier?.libelleSousThemeAtelier,
        prestation.session.sousThemeAtelier?.descriptifSousThemeAtelier
      ]
        .join('\n')
        .trim()
      return description || undefined
    default:
      return prestation.session.typePrestation?.descriptifTypePrestation
  }
}

function buildPrestationAdresse(prestation: PrestationDto): string | undefined {
  const adresse = [
    prestation.session.adresse?.adresseLigne1,
    prestation.session.adresse?.adresseLigne2,
    prestation.session.adresse?.codePostal,
    prestation.session.adresse?.ville
  ]
    .join(' ')
    .trim()
  return adresse || undefined
}

function buildPrestationDuration(prestation: PrestationDto): number {
  if (prestation.session.duree.unite === 'HEURE') {
    return Math.floor(prestation.session.duree.valeur * 60)
  }
  return 0
}

function buildRendezVousAdresse(
  rendezVousPoleEmploi: RendezVousPoleEmploiDto
): string | undefined {
  const adresse = [
    rendezVousPoleEmploi.adresse?.ligne4,
    rendezVousPoleEmploi.adresse?.ligne5,
    rendezVousPoleEmploi.adresse?.ligne6
  ]
    .join(' ')
    .trim()
  return adresse || undefined
}

function buildRendezVousModality(
  rendezVousPoleEmploiDto: RendezVousPoleEmploiDto
): string {
  if (rendezVousPoleEmploiDto.agence) {
    return 'en agence Pôle emploi'
  }
  switch (rendezVousPoleEmploiDto.modaliteContact) {
    case 'VISIO':
      return 'par visio'
    case 'TELEPHONIQUE':
      return 'par téléphone'
    case 'AGENCE':
      return 'en agence Pôle emploi'
    default:
      return ''
  }
}

function buildRendezVousDate(
  rendezVousPoleEmploiDto: RendezVousPoleEmploiDto
): Date {
  const date = new Date(rendezVousPoleEmploiDto.date)
  const heuresEtMinutes = rendezVousPoleEmploiDto.heure.split(':')
  date.setHours(parseInt(heuresEtMinutes[0]), parseInt(heuresEtMinutes[1]))
  return date
}
