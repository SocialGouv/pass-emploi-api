import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from './authentification'

export const EvenementsRepositoryToken = 'EvenementsRepositoryToken'

export namespace Evenement {
  export enum Type {
    ACTION_CREEE = 'ACTION_CREEE',
    ACTION_MODIFIEE = 'ACTION_MODIFIEE',
    ACTION_SUPPRIMEE = 'ACTION_SUPPRIMEE',
    OFFRE_AFFICHEE = 'OFFRE_AFFICHEE',
    OFFRE_RECHERCHEE = 'OFFRE_RECHERCHEE',
    OFFRE_SAUVEGARDEE = 'OFFRE_SAUVEGARDEE',
    OFFRE_POSTULEE = 'OFFRE_POSTULEE',
    OFFRE_PARTAGEE = 'OFFRE_PARTAGEE',
    MESSAGE_ENVOYE = 'MESSAGE_ENVOYE',
    RDV_CREE = 'RDV_CREE',
    RDV_SUPPRIME = 'RDV_SUPPRIME'
  }

  export interface Evenement {
    utilisateur: Authentification.Type
    categorie: string
    action: string
    nom?: string
  }

  export interface Repository {
    sendEvenement(evenement: Evenement): Promise<void>
  }
}

const evenements = {
  [Evenement.Type.ACTION_CREEE]: { categorie: 'Action', action: 'Création' },
  [Evenement.Type.ACTION_MODIFIEE]: {
    categorie: 'Action',
    action: 'Modification'
  },
  [Evenement.Type.ACTION_SUPPRIMEE]: {
    categorie: 'Action',
    action: 'Suppression'
  },
  [Evenement.Type.OFFRE_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: "type d'offre (Emploi, Alternance, Immersion)"
  },
  [Evenement.Type.OFFRE_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: "type d'offre (Emploi, Alternance, Immersion)"
  },
  [Evenement.Type.OFFRE_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: "type d'offre (Emploi, Alternance, Immersion)"
  },
  [Evenement.Type.OFFRE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: "type d'offre (Emploi, Alternance, Immersion)"
  },
  [Evenement.Type.OFFRE_PARTAGEE]: { categorie: 'Offre', action: 'Partage' },
  [Evenement.Type.MESSAGE_ENVOYE]: { categorie: 'Message', action: 'Envoi' },
  [Evenement.Type.RDV_CREE]: { categorie: 'Rendez-vous', action: 'Création' },
  [Evenement.Type.RDV_SUPPRIME]: {
    categorie: 'Rendez-vous',
    action: 'Suppression'
  }
}

@Injectable()
export class EvenementService {
  constructor(
    @Inject(EvenementsRepositoryToken)
    private evenementRepository: Evenement.Repository
  ) {}

  async creerEvenement(
    typeEvenement: Evenement.Type,
    typeUtilisateur: Authentification.Type
  ): Promise<void> {
    const evenement: Evenement.Evenement = {
      utilisateur: typeUtilisateur,
      ...evenements[typeEvenement]
    }

    this.evenementRepository.sendEvenement(evenement)
  }
}
