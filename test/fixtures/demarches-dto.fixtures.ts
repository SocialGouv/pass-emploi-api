import { DemarcheDto } from '../../src/infrastructure/clients/pole-emploi-partenaire-client'

export const uneDemarcheDto = (): DemarcheDto => ({
  id: 'id-demarche',
  etat: 'EC',
  dateFin: '2222-04-01T10:20:00+02:00',
  dateCreation: '',
  dateModification: '',
  origineCreateur: 'INDIVIDU',
  origineDemarche: 'PASS_EMPLOI',
  pourquoi: '',
  libellePourquoi: '',
  quoi: '',
  libelleQuoi: ''
})
