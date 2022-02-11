import { GetOffresEmploiQuery } from 'src/application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQuery } from 'src/application/queries/get-offres-immersion.query.handler'
import { RechercheQueryModel } from '../application/queries/query-models/recherches.query-model'
import { DateTime } from 'luxon'

export const RecherchesRepositoryToken = 'RecherchesRepositoryToken'

export interface Recherche {
  id: string
  type: Recherche.Type
  titre: string
  metier?: string
  localisation?: string
  criteres?: GetOffresEmploiQuery | GetOffresImmersionQuery
  idJeune: string
  dateCreation: DateTime
  dateDerniereRecherche: DateTime
  etat: Recherche.Etat
}

export namespace Recherche {
  export enum Type {
    OFFRES_EMPLOI = 'OFFRES_EMPLOI',
    OFFRES_IMMERSION = 'OFFRES_IMMERSION',
    OFFRES_ALTERNANCE = 'OFFRES_ALTERNANCE'
  }

  export enum Etat {
    SUCCES = 'SUCCES',
    ECHEC = 'ECHEC'
  }

  export interface Repository {
    saveRecherche(recherche: Recherche): Promise<void>
    getRecherches(idJeune: string): Promise<RechercheQueryModel[]>
    getRecherche(
      idRecherche: string,
      idJeune: string
    ): Promise<RechercheQueryModel | undefined>
    deleteRecherche(idRecherche: string, idJeune: string): Promise<void>
    findAvantDate(
      typeRecherches: Recherche.Type[],
      nombreRecherches: number,
      date: DateTime
    ): Promise<Recherche[]>
  }
}
