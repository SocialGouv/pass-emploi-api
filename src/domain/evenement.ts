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
    categorie?: string
    action?: string
    nom?: string
  }

  export interface Repository {
    sendEvenement(evenement: Evenement): Promise<void>
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
      utilisateur: typeUtilisateur
    }

    switch (typeEvenement) {
      case Evenement.Type.ACTION_CREEE:
        evenement.categorie = 'Action'
        evenement.action = 'Création'
        break
      case Evenement.Type.ACTION_MODIFIEE:
        evenement.categorie = 'Action'
        evenement.action = 'Modification'
        break
      case Evenement.Type.ACTION_SUPPRIMEE:
        evenement.categorie = 'Action'
        evenement.action = 'Suppression'
        break
      case Evenement.Type.OFFRE_AFFICHEE:
        evenement.categorie = 'Offre'
        evenement.action = 'Détail'
        evenement.nom = "type d'offre (Emploi, Alternance, Immersion)"
        break
      case Evenement.Type.OFFRE_RECHERCHEE:
        evenement.categorie = 'Offre'
        evenement.action = 'Recherche'
        evenement.nom = "type d'offre (Emploi, Alternance, Immersion)"
        break
      case Evenement.Type.OFFRE_SAUVEGARDEE:
        evenement.categorie = 'Offre'
        evenement.action = 'Favori'
        evenement.nom = "type d'offre (Emploi, Alternance, Immersion)"
        break
      case Evenement.Type.OFFRE_POSTULEE:
        evenement.categorie = 'Offre'
        evenement.action = 'Postuler'
        evenement.nom = "type d'offre (Emploi, Alternance, Immersion)"
        break
      case Evenement.Type.OFFRE_PARTAGEE:
        evenement.categorie = 'Offre'
        evenement.action = 'Partage'
        break
      case Evenement.Type.MESSAGE_ENVOYE:
        evenement.categorie = 'Message'
        evenement.action = 'Envoi'
        break
      case Evenement.Type.RDV_CREE:
        evenement.categorie = 'Rendez-vous'
        evenement.action = 'Création'
        break
      case Evenement.Type.RDV_SUPPRIME:
        evenement.categorie = 'Rendez-vous'
        evenement.action = 'Suppression'
        break
    }

    this.evenementRepository.sendEvenement(evenement)
  }
}
