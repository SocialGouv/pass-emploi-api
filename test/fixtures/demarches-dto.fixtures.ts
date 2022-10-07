import {
  DemarcheDto,
  DemarcheDtoEtat
} from '../../src/infrastructure/clients/dto/pole-emploi.dto'

export const uneDemarcheDto = (
  args: Partial<DemarcheDto> = {}
): DemarcheDto => {
  const defaults: DemarcheDto = {
    idDemarche: 'id-demarche',
    etat: DemarcheDtoEtat.EC,
    dateFin: '2022-04-01T10:20:00+02:00',
    dateCreation: '2022-03-01T10:20:00+02:00',
    dateModification: '2022-03-02T12:20:00+02:00',
    origineCreateur: 'INDIVIDU',
    origineDemarche: 'PASS_EMPLOI',
    pourquoi: 'P18',
    libellePourquoi: 'pourquoi',
    quoi: 'Q20',
    libelleQuoi: 'quoi',
    droitsDemarche: {
      annulation: true,
      modificationDate: true,
      realisation: true,
      replanification: false
    }
  }

  return { ...defaults, ...args }
}
