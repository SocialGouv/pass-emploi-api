import { Jeune } from './jeune'

export const ArchivageJeunesRepositoryToken = 'ArchivageJeune.Repository'

export namespace ArchivageJeune {
  export enum Motif {
    SORTIE_POSITIVE_DU_CEJ = 'Sortie positive du CEJ',
    RADIATION_DU_CEJ = 'Radiation du CEJ',
    RECREATION_D_UN_COMPTE_JEUNE = "Recréation d'un compte jeune",
    AUTRE = 'Autre'
  }

  export interface DonneesArchivees {
    actions: Array<{
      statut: string
      contenu: string
      commentaire: string
    }>
  }

  export interface Repository {
    archiver(idJeune: Jeune.Id): Promise<void>
  }
}
