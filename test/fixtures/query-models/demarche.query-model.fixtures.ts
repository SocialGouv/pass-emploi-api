import { ActionPoleEmploiQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { ActionPoleEmploi } from '../../../src/domain/action'
import { uneDate } from '../date.fixture'

export const desDemarches = (): ActionPoleEmploiQueryModel[] => [
  {
    id: 'id-demarche',
    contenu: undefined,
    statut: ActionPoleEmploi.Statut.EN_RETARD,
    dateFin: uneDate(),
    dateAnnulation: undefined,
    creeeParConseiller: false
  },
  {
    id: 'id-demarche',
    contenu: undefined,
    statut: ActionPoleEmploi.Statut.EN_COURS,
    dateFin: uneDate(),
    dateAnnulation: undefined,
    creeeParConseiller: false
  }
]
