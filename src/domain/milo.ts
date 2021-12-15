export const MiloRepositoryToken = 'Milo.Repository'

export namespace Milo {
  export interface Dossier {
    id: string
    prenom: string
    nom: string
    dateDeNaissance: string
    email?: string
    codePostal: string
  }

  export interface Repository {
    getDossier(id: string): Promise<Dossier | undefined>
  }
}
