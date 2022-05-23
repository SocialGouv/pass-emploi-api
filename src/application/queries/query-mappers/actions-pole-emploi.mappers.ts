import { ActionPoleEmploi } from 'src/domain/action'
import { DemarcheDto } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from 'src/utils/date-service'
import {
  DemarcheQueryModel,
  AttributDemarcheQueryModel
} from '../query-models/actions.query-model'

export function fromDemarcheDtoToDemarcheQueryModel(
  demarcheDto: DemarcheDto,
  dateService: DateService
): DemarcheQueryModel {
  return {
    id: demarcheDto.id,
    codeDemarche: codeEnBase64(demarcheDto),
    contenu: demarcheDto.libelleCourt,
    dateModification: demarcheDto.dateModification
      ? dateService.fromISOStringToUTCJSDate(demarcheDto.dateModification)
      : undefined,
    statut: buildStatut(demarcheDto, dateService),
    dateFin: dateService.fromISOStringToUTCJSDate(demarcheDto.dateFin),
    label: demarcheDto.libellePourquoi,
    titre: demarcheDto.libelleQuoi,
    sousTitre: demarcheDto.libelleComment,
    dateCreation: dateService.fromISOStringToUTCJSDate(
      demarcheDto.dateCreation
    ),
    attributs: buildAttributs(demarcheDto),
    statutsPossibles: buildStatutsPossibles(demarcheDto),
    modifieParConseiller: demarcheDto.origineModificateur === 'CONSEILLER',
    creeeParConseiller: demarcheDto.origineCreateur === 'CONSEILLER'
  }
}

function buildStatutsPossibles(
  demarcheDto: DemarcheDto
): ActionPoleEmploi.Statut[] {
  const statuts: ActionPoleEmploi.Statut[] = []

  if (demarcheDto.droitsDemarche?.annulation) {
    statuts.push(ActionPoleEmploi.Statut.ANNULEE)
  }

  if (demarcheDto.droitsDemarche?.realisation) {
    statuts.push(ActionPoleEmploi.Statut.REALISEE)
  }

  if (
    (demarcheDto.etat === 'AC' &&
      demarcheDto.droitsDemarche?.modificationDate) ||
    (demarcheDto.etat === 'RE' &&
      demarcheDto.droitsDemarche?.replanificationDate)
  ) {
    statuts.push(ActionPoleEmploi.Statut.A_FAIRE)
    statuts.push(ActionPoleEmploi.Statut.EN_COURS)
  }

  return statuts
}

function codeEnBase64(demarcheDto: DemarcheDto): string {
  const code: ActionPoleEmploi.Code = {
    quoi: demarcheDto.quoi,
    pourquoi: demarcheDto.pourquoi,
    comment: demarcheDto.comment
  }

  return ActionPoleEmploi.toBase64(code)
}

function buildAttributs(
  demarcheDto: DemarcheDto
): AttributDemarcheQueryModel[] {
  const attributs: AttributDemarcheQueryModel[] = []

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

  return attributs
}

function buildStatut(
  demarcheDto: DemarcheDto,
  dateService: DateService
): ActionPoleEmploi.Statut {
  const maintenant = dateService.nowJs().getTime()
  const debut = demarcheDto.dateDebut
    ? new Date(demarcheDto.dateDebut).getTime()
    : undefined

  switch (demarcheDto.etat) {
    case 'AC':
    case 'AF':
    case 'EC':
      if (!debut || debut < maintenant) return ActionPoleEmploi.Statut.EN_COURS
      return ActionPoleEmploi.Statut.A_FAIRE
    case 'RE':
      return ActionPoleEmploi.Statut.REALISEE
    case 'AN':
      return ActionPoleEmploi.Statut.ANNULEE
  }
}
