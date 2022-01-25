import { GetOffresEmploiQuery } from 'src/application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQuery } from 'src/application/queries/get-offres-immersion.query.handler'
import { Result } from '../building-blocks/types/result'

export const RecherchesRepositoryToken = 'RecherchesRepositoryToken'

export interface Recherche {
  type: Recherche.Type
  titre: string
  metier: string
  localisation: string
  criteres: GetOffresEmploiQuery | GetOffresImmersionQuery
}

export namespace Recherche {
  export enum Type {
    OFFRES_EMPLOI = 'OFFRES_EMPLOI',
    OFFRES_IMMERSION = 'OFFRES_IMMERSION',
    OFFRES_ALTERNANCE = 'OFFRES_ALTERNANCE'
  }

  export interface Repository {
    saveRecherche(idJeune: string, recherche: Recherche): Promise<Result>
  }
}
