export const OffresImmersionRepositoryToken = 'OffresImmersion.Repository'

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
    ): Promise<Immersion | undefined>

    save(idJeune: string, offreImmersion: Immersion): Promise<void>

    delete(idJeune: string, idOffreImmersion: string): Promise<void>
  }
}
