import { DateTime } from 'luxon'
import { Result } from '../../building-blocks/types/result'
import { Jeune } from '../jeune/jeune'

export const JeuneMiloRepositoryToken = 'JeuneMiloRepositoryToken'

export interface JeuneMilo extends Jeune {
  idStructureMilo?: string
}

export namespace JeuneMilo {
  interface Situation {
    etat: EtatSituation
    categorie: CategorieSituation
    dateFin?: string
  }

  export interface Situations {
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
    dateFinCEJ?: DateTime
    codeStructure?: string
  }

  export enum EtatSituation {
    PREVU = 'PREVU',
    EN_COURS = 'EN_COURS',
    TERMINE = 'TERMINE'
  }
  export enum CategorieSituation {
    EMPLOI = 'Emploi',
    CONTRAT_EN_ALTERNANCE = 'Contrat en Alternance',
    FORMATION = 'Formation',
    IMMERSION_EN_ENTREPRISE = 'Immersion en entreprise',
    PMSMP = 'Pmsmp',
    CONTRAT_DE_VOLONTARIAT_BENEVOLAT = 'Contrat de volontariat - bénévolat',
    SCOLARITE = 'Scolarité',
    DEMANDEUR_D_EMPLOI = "Demandeur d'emploi"
  }

  export interface Repository {
    get(id: string): Promise<Result<JeuneMilo>>
    getDossier(id: string): Promise<Result<Dossier>>
    getByIdDossier(idDossier: string): Promise<Result<JeuneMilo>>
    saveSituationsJeune(situations: Situations): Promise<void>
    save(
      jeune: JeuneMilo,
      codeStructureMilo?: string | null,
      dateFinCEJ?: DateTime | null
    ): Promise<void>
    getJeunesMiloAvecIdDossier(
      offset: number,
      limit: number
    ): Promise<JeuneMilo[]>
    getSituationsByJeune(idJeune: string): Promise<Situations | undefined>
    creerJeune(
      idDossier: string,
      surcharge?: boolean
    ): Promise<
      Result<{ idAuthentification?: string; existeDejaChezMilo: boolean }>
    >

    marquerAARchiver(id: string, aArchiver: boolean): Promise<void>
    estAArchiver(id: string): Promise<boolean>
  }

  export function trierSituations(situations: Situation[]): Situation[] {
    const etatsOrder: { [etat in EtatSituation]: number } = {
      EN_COURS: 0,
      PREVU: 1,
      TERMINE: 2
    }
    const categoriesOrder: { [categorie in CategorieSituation]: number } = {
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
      situation => situation.etat === EtatSituation.EN_COURS
    )
  }
}
