import { Demarche } from '../../src/domain/demarche'

export const uneDemarche = (args: Partial<Demarche> = {}): Demarche => {
  const defaults: Demarche = {
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
    dateCreation: new Date('2020-04-06T10:20:00.000Z'),
    dateFin: new Date('2020-04-06T10:20:00.000Z'),
    dateDebut: new Date('2020-04-06T10:20:00.000Z'),
    dateModification: new Date('2020-04-06T10:20:00.000Z'),
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
