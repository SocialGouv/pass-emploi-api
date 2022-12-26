import { EvenementMiloDto } from 'src/infrastructure/repositories/dto/milo.dto'
import { Partenaire } from '../../src/domain/partenaire/partenaire'

export const unEvenementMilo = (
  args: Partial<Partenaire.Milo.Evenement> = {}
): Partenaire.Milo.Evenement => {
  const defaults = {
    id: '63569521bdd5161673153f9f',
    idPartenaireBeneficiaire: '1234567',
    objet: Partenaire.Milo.ObjetEvenement.RENDEZ_VOUS,
    type: Partenaire.Milo.TypeEvenement.CREATE,
    idObjet: '34',
    date: '2022-10-24T08:00:34Z'
  }
  return { ...defaults, ...args }
}

export const unEvenementMiloDto = (
  args: Partial<EvenementMiloDto> = {}
): EvenementMiloDto => {
  const defaults: EvenementMiloDto = {
    identifiant: '63569521bdd5161673153f9f',
    idDossier: '1234567',
    type: 'RDV',
    action: 'CREATE',
    idType: '34',
    date: '2022-10-24T08:00:34Z'
  }
  return { ...defaults, ...args }
}
