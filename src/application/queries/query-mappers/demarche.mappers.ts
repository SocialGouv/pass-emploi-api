import { Demarche } from '../../../domain/demarche'
import { DemarcheQueryModel } from '../query-models/actions.query-model'

export function toDemarcheQueryModel(demarche: Demarche): DemarcheQueryModel {
  return {
    ...demarche,
    dateFin: demarche.dateFin.toISO(),
    dateDebut: demarche.dateDebut?.toISO(),
    dateModification: demarche.dateModification?.toISO(),
    dateCreation: demarche.dateCreation.toISO(),
    dateAnnulation: demarche.dateAnnulation?.toISO()
  }
}
