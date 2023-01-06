import { PrestationDto } from '../../src/infrastructure/clients/dto/pole-emploi.dto'
import { uneDatetime } from './date.fixture'

const dateString = uneDatetime().toString()

export const unePrestationDto = (
  args: Partial<PrestationDto> = {}
): PrestationDto => {
  const defaults: PrestationDto = {
    annule: false,
    datefin: dateString,
    session: {
      modalitePremierRendezVous: 'WEBCAM',
      dateDebut: dateString,
      dateFinPrevue: dateString,
      dateLimite: dateString,
      duree: {
        unite: 'JOUR',
        valeur: 1.0
      },
      typePrestation: {
        descriptifTypePrestation: 'desc'
      },
      enAgence: true,
      infoCollective: false,
      realiteVirtuelle: false
    }
  }

  return { ...defaults, ...args }
}
