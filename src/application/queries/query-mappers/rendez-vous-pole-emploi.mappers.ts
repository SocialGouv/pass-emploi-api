import { Jeune } from 'src/domain/jeune'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from 'src/domain/rendez-vous'
import { RendezVousPoleEmploiDto } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { IdService } from 'src/utils/id-service'
import { RendezVousQueryModel } from '../query-models/rendez-vous.query-models'

export function fromRendezVousDtoToRendezVousQueryModel(
  rendezVousPoleEmploiDto: RendezVousPoleEmploiDto,
  jeune: Jeune,
  idService: IdService
): RendezVousQueryModel {
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
    comment: rendezVousPoleEmploiDto.commentaire,
    jeune: { id: jeune.id, nom: jeune.lastName, prenom: jeune.firstName },
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
    lienVisio: rendezVousPoleEmploiDto.lienVisio
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
