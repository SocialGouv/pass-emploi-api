import {
  DemarcheDto,
  DemarcheDtoEtat
} from '../../src/infrastructure/clients/dto/pole-emploi.dto'

export const uneDemarcheDto = (): DemarcheDto => ({
  idDemarche: 'id-demarche',
  etat: DemarcheDtoEtat.EC,
  dateFin: '2222-04-01T10:20:00+02:00',
  dateCreation: '',
  dateModification: '',
  origineCreateur: 'INDIVIDU',
  origineDemarche: 'PASS_EMPLOI',
  pourquoi: '',
  libellePourquoi: '',
  quoi: '',
  libelleQuoi: '',
  droitsDemarche: {}
})
