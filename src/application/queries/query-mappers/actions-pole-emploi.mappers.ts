import { ActionPoleEmploi } from 'src/domain/action'
import { DemarcheDto } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { ActionPoleEmploiQueryModel } from '../query-models/actions.query-model'

export function fromDemarcheDtoToActionPoleEmploiQueryModel(
  demarcheDto: DemarcheDto,
  idService: IdService,
  dateService: DateService
): ActionPoleEmploiQueryModel {
  return {
    id: demarcheDto.id ?? idService.uuid(),
    contenu: demarcheDto.libelleCourt,
    statut: buildStatut(demarcheDto, dateService),
    dateFin: dateService.fromISOStringToUTCJSDate(demarcheDto.dateFin),
    dateAnnulation: demarcheDto.dateAnnulation
      ? dateService.fromISOStringToUTCJSDate(demarcheDto.dateAnnulation)
      : undefined,
    creeeParConseiller: demarcheDto.origineCreateur === 'CONSEILLER'
  }
}

function buildStatut(
  demarcheDto: DemarcheDto,
  dateService: DateService
): ActionPoleEmploi.Statut {
  const maintenant = dateService.nowJs().getTime()
  const fin = new Date(demarcheDto.dateFin).getTime()
  const debut = demarcheDto.dateDebut
    ? new Date(demarcheDto.dateDebut).getTime()
    : undefined

  switch (demarcheDto.etat) {
    case 'AC':
    case 'AF':
    case 'EC':
      if (fin < maintenant) return ActionPoleEmploi.Statut.EN_RETARD
      if (!debut || debut < maintenant) return ActionPoleEmploi.Statut.EN_COURS
      return ActionPoleEmploi.Statut.A_FAIRE
    case 'RE':
      return ActionPoleEmploi.Statut.REALISEE
    case 'AN':
      return ActionPoleEmploi.Statut.ANNULEE
  }
}
