import { GetOffresEmploiQuery } from 'src/application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQuery } from 'src/application/queries/get-offres-immersion.query.handler'
import { RechercheQueryModel } from '../application/queries/query-models/recherches.query-model'

export const RecherchesRepositoryToken = 'RecherchesRepositoryToken'

export interface Recherche {
  id: string
  type: Recherche.Type
  titre: string
  metier?: string
  localisation?: string
  criteres?: GetOffresEmploiQuery | GetOffresImmersionQuery
}

export namespace Recherche {
  export enum Type {
    OFFRES_EMPLOI = 'OFFRES_EMPLOI',
    OFFRES_IMMERSION = 'OFFRES_IMMERSION',
    OFFRES_ALTERNANCE = 'OFFRES_ALTERNANCE'
  }

  export interface Repository {
    saveRecherche(idJeune: string, recherche: Recherche): Promise<void>
    getRecherches(idJeune: string): Promise<RechercheQueryModel[]>
    getRecherche(idRecherche: string): Promise<RechercheQueryModel | undefined>
    deleteRecherche(idRecherche: string): Promise<void>
  }
}
