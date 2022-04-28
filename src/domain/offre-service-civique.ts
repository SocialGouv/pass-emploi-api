import { Result } from '../building-blocks/types/result'
import { DateTime } from 'luxon'
import { Core } from './core'
import { Jeune } from './jeune'

export const OffreServiceCiviqueRepositoryToken =
  'OffreServiceCivique.Repository'

export interface OffreServiceCivique {
  id: string
  domaine: string
  titre: string
  ville?: string
  organisation?: string
  dateDeDebut?: string
  dateDeFin?: string
  description?: string
  lienAnnonce?: string
  adresseOrganisation?: string
  adresseMission?: string
  urlOrganisation?: string
  codeDepartement?: string
  codePostal?: string
  descriptionOrganisation?: string
  localisation?: Core.Localisation
}

export namespace OffreServiceCivique {
  export const DISTANCE_PAR_DEFAUT = 10

  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<OffreServiceCivique[]>>

    getServiceCiviqueById(id: string): Promise<Result<OffreServiceCivique>>

    getFavorisIdsByJeune(id: Jeune.Id): Promise<Core.Id[]>

    getFavorisByJeune(id: Jeune.Id): Promise<OffreServiceCivique[]>

    saveAsFavori(idJeune: string, offre: OffreServiceCivique): Promise<void>

    getFavori(
      idJeune: string,
      idOffre: string
    ): Promise<OffreServiceCivique | undefined>

    deleteFavori(idJeune: string, idOffre: string): Promise<void>
  }

  export interface Criteres {
    page: number
    limit: number
    lat?: number
    lon?: number
    distance?: number
    dateDeDebutMinimum?: DateTime
    dateDeDebutMaximum?: DateTime
    domaine?: string
    dateDeCreationMinimum?: DateTime
    editeur: Editeur
  }

  export enum Editeur {
    SERVICE_CIVIQUE = '5f99dbe75eb1ad767733b206'
  }

  export enum Domaine {
    'environnement' = 'environnement',
    'solidarite-insertion' = 'solidarite-insertion',
    'prevention-protection' = 'prevention-protection',
    'sante' = 'sante',
    'culture-loisirs' = 'culture-loisirs',
    'education' = 'education',
    'emploi' = 'emploi',
    'sport' = 'sport',
    'humanitaire' = 'humanitaire',
    'animaux' = 'animaux',
    'vivre-ensemble' = 'vivre-ensemble',
    'autre' = 'autre'
  }
}
