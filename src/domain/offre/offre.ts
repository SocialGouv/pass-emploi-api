import * as _Favori from './favori/favori'
import * as _Recherche from './recherche/recherche'

export namespace Offre {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Favori = _Favori.Favori
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Recherche = _Recherche.Recherche
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars

  export namespace Emploi {
    export enum Contrat {
      cdi = 'CDI',
      cdd = 'CDD-interim-saisonnier',
      autre = 'autre'
    }

    export enum Experience {
      moinsdUnAn = '1',
      entreUnEtTroisAns = '2',
      plusDeTroisAns = '3'
    }

    export enum Duree {
      tempsPlein = '1',
      tempsPartiel = '2'
    }
  }

  export namespace Immersion {
    export enum MethodeDeContact {
      INCONNU = 'INCONNU',
      EMAIL = 'EMAIL',
      TELEPHONE = 'TELEPHONE',
      PRESENTIEL = 'PRESENTIEL'
    }
  }

  export namespace ServiceCivique {
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
}
