import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'
import { RendezVousPoleEmploiDto } from '../../../infrastructure/clients/dto/pole-emploi.dto'
import { IdService } from '../../../utils/id-service'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'

export function fromRendezVousDtoToRendezVousQueryModel(
  rendezVousPoleEmploiDto: RendezVousPoleEmploiDto,
  idService: IdService
): RendezVousJeuneQueryModel {
  return {
    id: idService.uuid(),
    title: '',
    type: {
      code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      label:
        mapCodeLabelTypeRendezVous[
          CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
        ]
    },
    date: buildDate(rendezVousPoleEmploiDto),
    isLocaleDate: true,
    comment: rendezVousPoleEmploiDto.commentaire,
    modality: buildModality(rendezVousPoleEmploiDto),
    duration: rendezVousPoleEmploiDto.duree,
    adresse: buildAdresse(rendezVousPoleEmploiDto),
    agencePE: rendezVousPoleEmploiDto.modaliteContact === 'AGENCE',
    conseiller:
      rendezVousPoleEmploiDto.nomConseiller &&
      rendezVousPoleEmploiDto.prenomConseiller
        ? {
            id: idService.uuid(),
            nom: rendezVousPoleEmploiDto.nomConseiller,
            prenom: rendezVousPoleEmploiDto.prenomConseiller
          }
        : undefined,
    theme: rendezVousPoleEmploiDto.theme,
    presenceConseiller: true,
    visio: rendezVousPoleEmploiDto.modaliteContact === 'VISIO',
    lienVisio: rendezVousPoleEmploiDto.lienVisio,
    source: RendezVous.Source.POLE_EMPLOI
  }
}

function buildAdresse(
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

function buildModality(
  rendezVousPoleEmploiDto: RendezVousPoleEmploiDto
): string {
  switch (rendezVousPoleEmploiDto.modaliteContact) {
    case 'VISIO':
      return 'par visio'
    case 'TELEPHONE':
    case 'TELEPHONIQUE':
      return 'par téléphone'
    case 'AGENCE':
      return 'en agence Pôle emploi'
    default:
      return ''
  }
}

function buildDate(rendezVousPoleEmploiDto: RendezVousPoleEmploiDto): Date {
  const date = new Date(rendezVousPoleEmploiDto.date)
  const heuresEtMinutes = rendezVousPoleEmploiDto.heure.split(':')
  if (heuresEtMinutes?.length === 2)
    date.setUTCHours(parseInt(heuresEtMinutes[0]), parseInt(heuresEtMinutes[1]))
  return date
}
