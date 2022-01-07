import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from './authentification'
import { Result } from '../building-blocks/types/result'

export const EvenementsRepositoryToken = 'EvenementsRepositoryToken'

export namespace Evenement {
  export enum Type {
    ACTION_CREEE = 'ACTION_CREEE',
    ACTION_MODIFIEE = 'ACTION_MODIFIEE',
    ACTION_SUPPRIMEE = 'ACTION_SUPPRIMEE',
    OFFRE_EMPLOI_AFFICHEE = 'OFFRE_EMPLOI_AFFICHEE',
    OFFRE_EMPLOI_RECHERCHEE = 'OFFRE_EMPLOI_RECHERCHEE',
    OFFRE_EMPLOI_SAUVEGARDEE = 'OFFRE_EMPLOI_SAUVEGARDEE',
    OFFRE_EMPLOI_POSTULEE = 'OFFRE_EMPLOI_POSTULEE',
    OFFRE_EMPLOI_PARTAGEE = 'OFFRE_EMPLOI_PARTAGEE',
    OFFRE_IMMERSION_AFFICHEE = 'OFFRE_IMMERSION_AFFICHEE',
    OFFRE_IMMERSION_RECHERCHEE = 'OFFRE_IMMERSION_RECHERCHEE',
    OFFRE_IMMERSION_SAUVEGARDEE = 'OFFRE_IMMERSION_SAUVEGARDEE',
    OFFRE_IMMERSION_POSTULEE = 'OFFRE_IMMERSION_POSTULEE',
    OFFRE_IMMERSION_PARTAGEE = 'OFFRE_IMMERSION_PARTAGEE',
    OFFRE_ALTERNANCE_AFFICHEE = 'OFFRE_ALTERNANCE_AFFICHEE',
    OFFRE_ALTERNANCE_RECHERCHEE = 'OFFRE_ALTERNANCE_RECHERCHEE',
    OFFRE_ALTERNANCE_SAUVEGARDEE = 'OFFRE_ALTERNANCE_SAUVEGARDEE',
    OFFRE_ALTERNANCE_POSTULEE = 'OFFRE_ALTERNANCE_POSTULEE',
    OFFRE_ALTERNANCE_PARTAGEE = 'OFFRE_ALTERNANCE_PARTAGEE',
    MESSAGE_ENVOYE = 'MESSAGE_ENVOYE',
    RDV_CREE = 'RDV_CREE',
    RDV_SUPPRIME = 'RDV_SUPPRIME'
  }

  export interface Repository {
    sendEvenement(
      utilisateur: Authentification.Utilisateur,
      categorieEvenement: string,
      actionEvenement: string,
      nomEvenement?: string
    ): Promise<Result>
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
  [Evenement.Type.OFFRE_EMPLOI_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: "type d'offre (Emploi)"
  },
  [Evenement.Type.OFFRE_EMPLOI_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: "type d'offre (Emploi)"
  },
  [Evenement.Type.OFFRE_EMPLOI_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: "type d'offre (Emploi)"
  },
  [Evenement.Type.OFFRE_EMPLOI_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: "type d'offre (Emploi)"
  },
  [Evenement.Type.OFFRE_EMPLOI_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage'
  },
  [Evenement.Type.OFFRE_IMMERSION_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: "type d'offre (Immersion)"
  },
  [Evenement.Type.OFFRE_IMMERSION_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: "type d'offre (Immersion)"
  },
  [Evenement.Type.OFFRE_IMMERSION_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: "type d'offre (Immersion)"
  },
  [Evenement.Type.OFFRE_IMMERSION_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: "type d'offre (Immersion)"
  },
  [Evenement.Type.OFFRE_IMMERSION_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage'
  },
  [Evenement.Type.OFFRE_ALTERNANCE_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: "type d'offre (Alternance)"
  },
  [Evenement.Type.OFFRE_ALTERNANCE_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: "type d'offre (Alternance)"
  },
  [Evenement.Type.OFFRE_ALTERNANCE_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: "type d'offre (Alternance)"
  },
  [Evenement.Type.OFFRE_ALTERNANCE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: "type d'offre (Alternance)"
  },
  [Evenement.Type.OFFRE_ALTERNANCE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage'
  },
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
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const evenement: { categorie: string; action: string; nom?: string } =
      evenements[typeEvenement]

    this.evenementRepository.sendEvenement(
      utilisateur,
      evenement.categorie,
      evenement.action,
      evenement.nom
    )
  }
}
