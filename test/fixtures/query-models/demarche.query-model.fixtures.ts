import { DemarcheQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { Demarche } from '../../../src/domain/demarche'

export const uneDemarcheQueryModel = (
  args: Partial<DemarcheQueryModel> = {}
): DemarcheQueryModel => {
  const defaults: DemarcheQueryModel = {
    attributs: [
      {
        cle: 'metier',
        label: 'Nom du métier',
        valeur: 'Agriculture'
      },
      {
        cle: 'description',
        label: 'Description',
        valeur: 'Candidature chez diffÃ©rents employeurs'
      },
      {
        cle: 'nombre',
        label: 'Nombre',
        valeur: 5
      }
    ],
    codeDemarche: 'codeDemarche',
    contenu: 'Identification de ses compétences avec pole-emploi.fr',
    creeeParConseiller: true,
    dateCreation: '2020-04-06T10:20:00.000Z',
    dateFin: '2020-04-06T10:20:00.000Z',
    dateDebut: '2020-04-06T10:20:00.000Z',
    dateModification: '2020-04-06T10:20:00.000Z',
    id: '198916488',
    label: 'Mon (nouveau) métier',
    modifieParConseiller: false,
    sousTitre: 'Par un autre moyen',
    statut: Demarche.Statut.REALISEE,
    statutsPossibles: [],
    titre: 'Identification de ses points forts et de ses compétences'
  }
  return { ...defaults, ...args }
}

export const desDemarchesQueryModel = (): DemarcheQueryModel[] => [
  {
    attributs: [
      {
        cle: 'metier',
        label: 'Nom du métier',
        valeur: 'Agriculture'
      },
      {
        cle: 'description',
        label: 'Description',
        valeur: 'Candidature chez diffÃ©rents employeurs'
      },
      {
        cle: 'nombre',
        label: 'Nombre',
        valeur: 5
      }
    ],
    codeDemarche: '',
    contenu: 'Identification de ses compétences avec pole-emploi.fr',
    creeeParConseiller: true,
    dateCreation: '2020-04-06T10:20:00.000Z',
    dateFin: '2020-04-06T10:20:00.000Z',
    dateModification: '2020-04-06T10:20:00.000Z',
    id: '198916488',
    label: 'Mon (nouveau) métier',
    modifieParConseiller: false,
    sousTitre: 'Par un autre moyen',
    statut: Demarche.Statut.REALISEE,
    statutsPossibles: [],
    titre: 'Identification de ses points forts et de ses compétences'
  },
  {
    attributs: [
      {
        cle: 'metier',
        label: 'Nom du métier',
        valeur: 'Agriculture'
      },
      {
        cle: 'description',
        label: 'Description',
        valeur: 'Candidature chez diffÃ©rents employeurs'
      },
      {
        cle: 'nombre',
        label: 'Nombre',
        valeur: 5
      }
    ],
    codeDemarche: '',
    contenu: 'Identification de ses compétences avec pole-emploi.fr',
    creeeParConseiller: true,
    dateCreation: '2020-04-06T10:20:00.000Z',
    dateFin: '2020-04-06T10:20:00.000Z',
    dateModification: '2020-04-06T10:20:00.000Z',
    id: '198916489',
    label: 'Mon (nouveau) métier',
    modifieParConseiller: false,
    sousTitre: 'Par un autre moyen',
    statut: Demarche.Statut.EN_COURS,
    statutsPossibles: [],
    titre: 'Identification de ses points forts et de ses compétences'
  }
]
