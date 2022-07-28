import { DateService } from 'src/utils/date-service'
import { Demarche } from '../../../domain/demarche'
import {
  DemarcheDto,
  DemarcheDtoEtat
} from '../../../infrastructure/clients/dto/pole-emploi.dto'
import { DateTime } from 'luxon'
import { Logger } from '@nestjs/common'

export function fromDemarcheDtoToDemarche(
  demarcheDto: DemarcheDto,
  dateService: DateService
): Demarche {
  return {
    id: demarcheDto.idDemarche,
    codeDemarche: codeEnBase64(demarcheDto),
    contenu: demarcheDto.libelleCourt,
    dateModification: demarcheDto.dateModification
      ? dateService.fromISOStringToUTCJSDate(demarcheDto.dateModification)
      : undefined,
    statut: buildStatut(demarcheDto, dateService),
    dateFin: dateService.fromISOStringToUTCJSDate(demarcheDto.dateFin),
    dateDebut: demarcheDto.dateDebut
      ? dateService.fromISOStringToUTCJSDate(demarcheDto.dateDebut)
      : undefined,
    dateAnnulation: demarcheDto.dateAnnulation
      ? dateService.fromISOStringToUTCJSDate(demarcheDto.dateAnnulation)
      : undefined,
    label: demarcheDto.libellePourquoi,
    titre: demarcheDto.libelleQuoi,
    sousTitre: demarcheDto.libelleComment,
    dateCreation: dateService.fromISOStringToUTCJSDate(
      demarcheDto.dateCreation
    ),
    attributs: buildAttributs(demarcheDto),
    statutsPossibles: buildStatutsPossibles(demarcheDto, dateService.nowJs()),
    modifieParConseiller: demarcheDto.origineModificateur === 'CONSEILLER',
    creeeParConseiller: demarcheDto.origineCreateur === 'CONSEILLER'
  }
}

function buildStatutsPossibles(
  demarcheDto: DemarcheDto,
  maintenant: Date
): Demarche.Statut[] {
  const statuts: Demarche.Statut[] = []

  if (demarcheDto.droitsDemarche?.annulation) {
    statuts.push(Demarche.Statut.ANNULEE)
  }

  if (demarcheDto.droitsDemarche?.realisation) {
    statuts.push(Demarche.Statut.REALISEE)
  }

  if (
    demarcheDto.etat === 'AC' &&
    demarcheDto.droitsDemarche?.modificationDate
  ) {
    statuts.push(Demarche.Statut.A_FAIRE)

    const dateFin = DateTime.fromISO(demarcheDto.dateFin)
      .set({ hour: 12 })
      .toJSDate()
    if (dateFin > maintenant) {
      statuts.push(Demarche.Statut.EN_COURS)
    }
  }

  if (
    demarcheDto.etat === 'RE' &&
    demarcheDto.droitsDemarche?.replanification
  ) {
    statuts.push(Demarche.Statut.A_FAIRE)
  }

  return statuts
}

function codeEnBase64(demarcheDto: DemarcheDto): string {
  const code: Demarche.Code = {
    quoi: demarcheDto.quoi,
    pourquoi: demarcheDto.pourquoi,
    comment: demarcheDto.comment
  }

  return Demarche.toBase64(code)
}

function buildAttributs(demarcheDto: DemarcheDto): Demarche.Attribut[] {
  const attributs: Demarche.Attribut[] = []

  if (demarcheDto.organisme) {
    attributs.push({
      cle: 'organisme',
      valeur: demarcheDto.organisme,
      label: 'Nom de l’organisme'
    })
  }

  if (demarcheDto.metier) {
    attributs.push({
      cle: 'metier',
      valeur: demarcheDto.metier,
      label: 'Nom du métier'
    })
  }

  if (demarcheDto.description) {
    attributs.push({
      cle: 'description',
      valeur: demarcheDto.description,
      label: 'Description'
    })
  }

  if (demarcheDto.nombre) {
    attributs.push({
      cle: 'nombre',
      valeur: demarcheDto.nombre,
      label: 'Nombre'
    })
  }

  if (demarcheDto.contact) {
    attributs.push({
      cle: 'contact',
      valeur: demarcheDto.contact,
      label: 'Contact'
    })
  }

  if (demarcheDto.ou) {
    attributs.push({
      cle: 'ou',
      valeur: demarcheDto.ou,
      label: 'Ou'
    })
  }

  return attributs
}

function buildStatut(
  demarcheDto: DemarcheDto,
  dateService: DateService
): Demarche.Statut {
  const aujourdhuiAMidi = dateService.now().set({ hour: 12 })
  const debut = demarcheDto.dateDebut
    ? DateTime.fromISO(demarcheDto.dateDebut)
    : undefined

  switch (demarcheDto.etat) {
    case DemarcheDtoEtat.AC:
    case DemarcheDtoEtat.AF:
    case DemarcheDtoEtat.EC:
      if (debut && debut < aujourdhuiAMidi) return Demarche.Statut.EN_COURS
      return Demarche.Statut.A_FAIRE
    case DemarcheDtoEtat.RE:
      return Demarche.Statut.REALISEE
    case DemarcheDtoEtat.AN:
      return Demarche.Statut.ANNULEE
    default:
      const logger = new Logger('ActionPoleEmploiMappers.buildStatut')
      logger.error('Une démarche a un statut inconnu')
      logger.error(demarcheDto)
      return Demarche.Statut.REALISEE
  }
}
