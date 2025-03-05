import { Offre } from 'src/domain/offre/offre'

export const FavorisOffresImmersionRepositoryToken =
  'Favoris.OffresImmersion.Repository'

export interface Immersion {
  id: string
  metier: string
  nomEtablissement: string
  secteurActivite: string
  ville: string
}

export namespace Immersion {
  export interface Repository {
    get(
      idJeune: string,
      idOffreImmersion: string
    ): Promise<Offre.Favori<Immersion> | undefined>

    save(favori: Offre.Favori<Immersion>): Promise<void>

    delete(idJeune: string, idOffreImmersion: string): Promise<void>
  }
}
