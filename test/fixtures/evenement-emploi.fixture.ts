import { EvenementEmploiDetailDto } from '../../src/infrastructure/repositories/dto/pole-emploi.dto'

export const unEvenementEmploiDto = (
  args: Partial<EvenementEmploiDetailDto> = {}
): EvenementEmploiDetailDto => {
  const defaults: EvenementEmploiDetailDto = {
    id: 11111,
    ville: 'Paris',
    codePostal: '75012',
    codeInsee: '01419',
    longitude: 2.165241486514305,
    latitude: 36.14363481435547,
    description: 'Petite description',
    heureDebut: '07:00:00',
    heureFin: '09:00:00',
    timezone: 'Europe/Paris',
    objectifs: ['International', 'Marché du travail'],
    publics: ['Ouvert à tous'],
    type: 'Atelier',
    modalites: ['en physique'],
    nombrePlaceTotalDistance: 0,
    nombrePlaceTotalPresentiel: 20,
    nombreInscritDistance: 0,
    nombreInscritPresentiel: 1,
    dateEvenement: '2023-05-17T07:00:00.000+00:00',
    titre: 'Atelier du travail',
    codesRome: ['J', 'M', 'N'],
    multisectoriel: true,
    urlDetailEvenement:
      'https://mesevenementsemploi-t.pe-qvr.fr/mes-evenements-emploi/mes-evenements-emploi/evenement/11111'
  }

  return { ...defaults, ...args }
}
