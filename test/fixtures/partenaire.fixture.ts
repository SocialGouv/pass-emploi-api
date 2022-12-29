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

export const unRendezVousMilo = (
  args: Partial<Partenaire.Milo.RendezVous> = {}
): Partenaire.Milo.RendezVous => {
  const defaults: Partenaire.Milo.RendezVous = {
    id: '34',
    dateHeureDebut: '2022-10-06 10:00:00',
    dateHeureFin: '2022-10-06 12:00:00',
    titre: 'Test RDV',
    idPartenaireBeneficiaire: '5045180',
    commentaire: '',
    type: Partenaire.Milo.RendezVous.Type.RENDEZ_VOUS,
    statut: 'Planifié'
  }
  return { ...defaults, ...args }
}
