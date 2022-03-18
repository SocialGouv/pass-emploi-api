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
    OFFRE_IMMERSION_APPEL = 'OFFRE_IMMERSION_APPEL',
    OFFRE_IMMERSION_ENVOI_EMAIL = 'OFFRE_IMMERSION_ENVOI_EMAIL',
    OFFRE_IMMERSION_LOCALISATION = 'OFFRE_IMMERSION_LOCALISATION',
    OFFRE_ALTERNANCE_AFFICHEE = 'OFFRE_ALTERNANCE_AFFICHEE',
    OFFRE_ALTERNANCE_RECHERCHEE = 'OFFRE_ALTERNANCE_RECHERCHEE',
    OFFRE_ALTERNANCE_SAUVEGARDEE = 'OFFRE_ALTERNANCE_SAUVEGARDEE',
    OFFRE_ALTERNANCE_POSTULEE = 'OFFRE_ALTERNANCE_POSTULEE',
    OFFRE_ALTERNANCE_PARTAGEE = 'OFFRE_ALTERNANCE_PARTAGEE',
    OFFRE_POSTULEE = 'OFFRE_POSTULEE',
    OFFRE_PARTAGEE = 'OFFRE_PARTAGEE',
    MESSAGE_ENVOYE = 'MESSAGE_ENVOYE',
    MESSAGE_ENVOYE_MULTIPLE = 'MESSAGE_ENVOYE_MULTIPLE',
    RDV_CREE = 'RDV_CREE',
    RDV_SUPPRIME = 'RDV_SUPPRIME',
    RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE = 'RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE',
    RECHERCHE_ALTERNANCE_SAUVEGARDEE = 'RECHERCHE_ALTERNANCE_SAUVEGARDEE',
    RECHERCHE_IMMERSION_SAUVEGARDEE = 'RECHERCHE_IMMERSION_SAUVEGARDEE',
    SERVICE_CIVIQUE_RECHERCHE = 'SERVICE_CIVIQUE_RECHERCHE',
    OFFRE_SERVICE_CIVIQUE_AFFICHE = 'OFFRE_SERVICE_CIVIQUE_AFFICHE',
    OFFRE_SERVICE_CIVIQUE_PARTAGEE = 'OFFRE_SERVICE_CIVIQUE_PARTAGEE',
    OFFRE_SERVICE_CIVIQUE_POSTULEE = 'OFFRE_SERVICE_CIVIQUE_POSTULEE',
    OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE = 'OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE',
    RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE = 'RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE'
  }

  export interface Repository {
    saveEvenement(
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
    nom: 'Emploi'
  },
  [Evenement.Type.OFFRE_EMPLOI_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Emploi'
  },
  [Evenement.Type.OFFRE_EMPLOI_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Emploi'
  },
  [Evenement.Type.OFFRE_EMPLOI_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Emploi'
  },
  [Evenement.Type.OFFRE_EMPLOI_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Emploi'
  },
  [Evenement.Type.OFFRE_IMMERSION_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Immersion'
  },
  [Evenement.Type.OFFRE_IMMERSION_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Immersion'
  },
  [Evenement.Type.OFFRE_IMMERSION_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Immersion'
  },
  [Evenement.Type.OFFRE_IMMERSION_APPEL]: {
    categorie: 'Offre',
    action: 'Appel',
    nom: 'Immersion'
  },
  [Evenement.Type.OFFRE_IMMERSION_ENVOI_EMAIL]: {
    categorie: 'Offre',
    action: 'Envoi email',
    nom: 'Immersion'
  },
  [Evenement.Type.OFFRE_IMMERSION_LOCALISATION]: {
    categorie: 'Offre',
    action: 'Localiser',
    nom: 'Immersion'
  },
  [Evenement.Type.OFFRE_ALTERNANCE_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Alternance'
  },
  [Evenement.Type.OFFRE_ALTERNANCE_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Alternance'
  },
  [Evenement.Type.OFFRE_ALTERNANCE_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Alternance'
  },
  [Evenement.Type.OFFRE_ALTERNANCE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Alternance'
  },
  [Evenement.Type.OFFRE_ALTERNANCE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Alternance'
  },
  [Evenement.Type.OFFRE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partager'
  },
  [Evenement.Type.OFFRE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler'
  },
  [Evenement.Type.MESSAGE_ENVOYE]: { categorie: 'Message', action: 'Envoi' },
  [Evenement.Type.MESSAGE_ENVOYE_MULTIPLE]: {
    categorie: 'Message',
    action: 'Envoi multiple'
  },
  [Evenement.Type.RDV_CREE]: { categorie: 'Rendez-vous', action: 'Création' },
  [Evenement.Type.RDV_SUPPRIME]: {
    categorie: 'Rendez-vous',
    action: 'Suppression'
  },
  [Evenement.Type.RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Emploi'
  },
  [Evenement.Type.RECHERCHE_ALTERNANCE_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Alternance'
  },
  [Evenement.Type.RECHERCHE_IMMERSION_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Immersion'
  },
  [Evenement.Type.SERVICE_CIVIQUE_RECHERCHE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Service Civique'
  },
  [Evenement.Type.OFFRE_SERVICE_CIVIQUE_AFFICHE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Service Civique'
  },
  [Evenement.Type.OFFRE_SERVICE_CIVIQUE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Service Civique'
  },
  [Evenement.Type.OFFRE_SERVICE_CIVIQUE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partager',
    nom: 'Service Civique'
  },
  [Evenement.Type.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Service Civique'
  },
  [Evenement.Type.RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Service Civique'
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

    await this.evenementRepository.saveEvenement(
      utilisateur,
      evenement.categorie,
      evenement.action,
      evenement.nom
    )
  }
}
