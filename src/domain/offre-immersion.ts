export const OffresImmersionRepositoryToken = 'OffresImmersion.Repository'

export interface OffreImmersion {
  id: string
  metier: string
  nomEtablissement: string
  secteurActivite: string
  ville: string
}

export namespace OffresImmersion {
  export const DISTANCE_PAR_DEFAUT = 10

  export interface Repository {
    getFavori(
      idJeune: string,
      idOffreImmersion: string
    ): Promise<OffreImmersion | undefined>

    saveAsFavori(idJeune: string, offreImmersion: OffreImmersion): Promise<void>

    deleteFavori(idJeune: string, idOffreImmersion: string): Promise<void>
  }

  export interface Criteres {
    rome: string
    lat: number
    lon: number
    distance: number
  }

  export enum MethodeDeContact {
    INCONNU = 'INCONNU',
    EMAIL = 'EMAIL',
    TELEPHONE = 'TELEPHONE',
    PRESENTIEL = 'PRESENTIEL'
  }
}
