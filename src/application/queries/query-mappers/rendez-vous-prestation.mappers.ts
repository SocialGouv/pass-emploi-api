import { RendezVousJeuneQueryModel } from '../query-models/rendez-vous.query-model'
import { PrestationDto } from '../../../infrastructure/clients/dto/pole-emploi.dto'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { IdService } from '../../../utils/id-service'

export function fromPrestationDtoToRendezVousQueryModel(
  prestation: PrestationDto,
  idService: IdService,
  lienVisio?: string
): RendezVousJeuneQueryModel {
  return {
    id: idService.uuid(),
    title: '',
    idStable: prestation.identifiantStable,
    type: {
      code: CodeTypeRendezVous.PRESTATION,
      label: mapCodeLabelTypeRendezVous[CodeTypeRendezVous.PRESTATION]
    },
    date: buildDateSansTimezone(prestation.session.dateDebut),
    isLocaleDate: true,
    comment: prestation.session.commentaire,
    modality: buildModality(prestation),
    duration: buildDuration(prestation),
    description: buildDescription(prestation),
    adresse: buildAdresse(prestation),
    organisme: prestation.session.adresse?.adresseLigne3,
    agencePE: prestation.session.enAgence,
    theme: prestation.session.typePrestation?.libelle,
    telephone: prestation.session.adresse?.telephone,
    annule: prestation.annule,
    visio: estVisio(prestation),
    lienVisio,
    source: RendezVous.Source.POLE_EMPLOI
  }
}

export function estVisio(prestation: PrestationDto): boolean {
  return (
    prestation.session.natureAnimation === 'INTERNE' ||
    prestation.session.modalitePremierRendezVous === 'WEBCAM' ||
    prestation.session.enAgence === false
  )
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
  const descriptionSousTheme = [
    prestation.session.sousThemeAtelier?.libelleSousThemeAtelier,
    prestation.session.sousThemeAtelier?.descriptifSousThemeAtelier
  ]
    .join('\n')
    .trim()
  if (descriptionSousTheme) return descriptionSousTheme

  const descriptionTheme = [
    prestation.session.themeAtelier?.libelle,
    prestation.session.themeAtelier?.descriptif
  ]
    .join('\n')
    .trim()
  if (descriptionTheme) return descriptionTheme

  return prestation.session.typePrestation?.descriptifTypePrestation
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

export function buildDateSansTimezone(dateDebutPrestation: string): Date {
  const dateSansLaTimeZone = dateDebutPrestation.substring(0, 19)
  return new Date(dateSansLaTimeZone + 'Z')
}

function buildDuration(prestation: PrestationDto): number {
  if (prestation.session.duree.unite === 'HEURE') {
    return Math.floor(prestation.session.duree.valeur * 60)
  }
  return 0
}
