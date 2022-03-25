import { Jeune } from 'src/domain/jeune'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous
} from 'src/domain/rendez-vous'
import { PrestationDto } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { RendezVousQueryModel } from '../query-models/rendez-vous.query-models'

export function fromPrestationDtoToRendezVousQueryModel(
  prestation: PrestationDto,
  jeune: Jeune,
  idService: IdService,
  dateService: DateService,
  lienVisio?: string
): RendezVousQueryModel {
  return {
    id: idService.uuid(),
    title: '',
    idStable: prestation.identifiantStable,
    type: {
      code: CodeTypeRendezVous.PRESTATION,
      label: mapCodeLabelTypeRendezVous[CodeTypeRendezVous.PRESTATION]
    },
    date: dateService.fromISOStringToUTCJSDate(prestation.session.dateDebut),
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
  const descriptionTheme = [
    prestation.session.themeAtelier?.libelle,
    prestation.session.themeAtelier?.descriptif
  ]
    .join('\n')
    .trim()
  if (descriptionTheme) return descriptionTheme

  const descriptionSousTheme = [
    prestation.session.sousThemeAtelier?.libelleSousThemeAtelier,
    prestation.session.sousThemeAtelier?.descriptifSousThemeAtelier
  ]
    .join('\n')
    .trim()
  if (descriptionSousTheme) return descriptionSousTheme

  return undefined
}

function buildAdresse(prestation: PrestationDto): string | undefined {
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

function buildDuration(prestation: PrestationDto): number {
  if (prestation.session.duree.unite === 'HEURE') {
    return Math.floor(prestation.session.duree.valeur * 60)
  }
  return 0
}
