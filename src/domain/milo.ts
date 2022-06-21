import { Result } from '../building-blocks/types/result'

export const MiloRepositoryToken = 'Milo.Repository'

export enum EtatSituationMilo {
  PREVU = 'PREVU',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE'
}
export enum CategorieSituationMilo {
  EMPLOI = 'Emploi',
  CONTRAT_EN_ALTERNANCE = 'Contrat en Alternance',
  FORMATION = 'Formation',
  IMMERSION_EN_ENTREPRISE = 'Immersion en entreprise',
  PMSMP = 'Pmsmp',
  CONTRAT_DE_VOLONTARIAT_BENEVOLAT = 'Contrat de volontariat - bénévolat',
  SCOLARITE = 'Scolarité',
  DEMANDEUR_D_EMPLOI = "Demandeur d'emploi"
}

export namespace Milo {
  interface Situation {
    etat: EtatSituationMilo
    categorie: CategorieSituationMilo
    dateFin?: string
  }

  export interface SituationsDuJeune {
    idJeune: string
    situationCourante?: Situation
    situations: Situation[]
  }
  export interface Dossier {
    id: string
    prenom: string
    nom: string
    dateDeNaissance: string
    email?: string
    codePostal: string
    situations: Situation[]
  }

  export interface Repository {
    getDossier(id: string): Promise<Result<Dossier>>
    saveSituationsJeune(situations: SituationsDuJeune): Promise<void>
    getSituationsByJeune(
      idJeune: string
    ): Promise<SituationsDuJeune | undefined>
    creerJeune(
      idDossier: string
    ): Promise<Result<{ idAuthentification?: string }>>
  }

  export function trierSituations(situations: Situation[]): Situation[] {
    const etatsOrder: { [etat in EtatSituationMilo]: number } = {
      EN_COURS: 0,
      PREVU: 1,
      TERMINE: 2
    }
    const categoriesOrder: { [categorie in CategorieSituationMilo]: number } = {
      Emploi: 0,
      'Contrat en Alternance': 1,
      Formation: 2,
      'Immersion en entreprise': 3,
      Pmsmp: 4,
      'Contrat de volontariat - bénévolat': 5,
      Scolarité: 6,
      "Demandeur d'emploi": 7
    }

    return situations
      .filter(situation => situation.categorie)
      .sort((situation1: Situation, situation2: Situation) => {
        const compareEtats =
          etatsOrder[situation1.etat] - etatsOrder[situation2.etat]
        const compareCategories =
          categoriesOrder[situation1.categorie] -
          categoriesOrder[situation2.categorie]

        return compareEtats || compareCategories
      })
  }

  export function trouverSituationCourante(
    situationsTriees: Situation[]
  ): Situation | undefined {
    return situationsTriees.find(
      situation => situation.etat === EtatSituationMilo.EN_COURS
    )
  }
}
