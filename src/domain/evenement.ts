import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from './authentification'
import { Result } from '../building-blocks/types/result'

export const EvenementsRepositoryToken = 'EvenementsRepositoryToken'

export namespace Evenement {
  export enum Type {
    ACTION_CREEE = 'ACTION_CREEE',
    ACTION_DETAIL = 'ACTION_DETAIL',
    ACTION_LISTE = 'ACTION_LISTE',
    ACTION_STATUT_MODIFIE = 'ACTION_STATUT_MODIFIE',
    ACTION_SUPPRIMEE = 'ACTION_SUPPRIMEE',
    ACTION_COMMENTEE = 'ACTION_COMMENTEE',
    ACTION_QUALIFIEE_SNP = 'ACTION_QUALIFIEE_SNP',
    ACTION_QUALIFIEE_NON_SNP = 'ACTION_QUALIFIEE_NON_SNP',
    COMPTE_SUPPRIME = 'COMPTE_SUPPRIME',
    COMPTE_ARCHIVE = 'COMPTE_ARCHIVE',
    MESSAGE_ENVOYE = 'MESSAGE_ENVOYE',
    MESSAGE_ENVOYE_MULTIPLE = 'MESSAGE_ENVOYE_MULTIPLE',
    MESSAGE_ENVOYE_PJ = 'MESSAGE_ENVOYE_PJ',
    MESSAGE_ENVOYE_MULTIPLE_PJ = 'MESSAGE_ENVOYE_MULTIPLE_PJ',
    MESSAGE_OFFRE_PARTAGEE = 'MESSAGE_OFFRE_PARTAGEE',
    OFFRE_ALTERNANCE_AFFICHEE = 'OFFRE_ALTERNANCE_AFFICHEE',
    OFFRE_ALTERNANCE_PARTAGEE = 'OFFRE_ALTERNANCE_PARTAGEE',
    OFFRE_ALTERNANCE_POSTULEE = 'OFFRE_ALTERNANCE_POSTULEE',
    OFFRE_ALTERNANCE_RECHERCHEE = 'OFFRE_ALTERNANCE_RECHERCHEE',
    OFFRE_ALTERNANCE_SAUVEGARDEE = 'OFFRE_ALTERNANCE_SAUVEGARDEE',
    OFFRE_EMPLOI_AFFICHEE = 'OFFRE_EMPLOI_AFFICHEE',
    OFFRE_EMPLOI_PARTAGEE = 'OFFRE_EMPLOI_PARTAGEE',
    OFFRE_EMPLOI_POSTULEE = 'OFFRE_EMPLOI_POSTULEE',
    OFFRE_EMPLOI_RECHERCHEE = 'OFFRE_EMPLOI_RECHERCHEE',
    OFFRE_EMPLOI_SAUVEGARDEE = 'OFFRE_EMPLOI_SAUVEGARDEE',
    OFFRE_IMMERSION_AFFICHEE = 'OFFRE_IMMERSION_AFFICHEE',
    OFFRE_IMMERSION_APPEL = 'OFFRE_IMMERSION_APPEL',
    OFFRE_IMMERSION_ENVOI_EMAIL = 'OFFRE_IMMERSION_ENVOI_EMAIL',
    OFFRE_IMMERSION_LOCALISATION = 'OFFRE_IMMERSION_LOCALISATION',
    OFFRE_IMMERSION_RECHERCHEE = 'OFFRE_IMMERSION_RECHERCHEE',
    OFFRE_IMMERSION_SAUVEGARDEE = 'OFFRE_IMMERSION_SAUVEGARDEE',
    OFFRE_PARTAGEE = 'OFFRE_PARTAGEE',
    OFFRE_POSTULEE = 'OFFRE_POSTULEE',
    OFFRE_SERVICE_CIVIQUE_AFFICHE = 'OFFRE_SERVICE_CIVIQUE_AFFICHE',
    OFFRE_SERVICE_CIVIQUE_PARTAGEE = 'OFFRE_SERVICE_CIVIQUE_PARTAGEE',
    OFFRE_SERVICE_CIVIQUE_POSTULEE = 'OFFRE_SERVICE_CIVIQUE_POSTULEE',
    OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE = 'OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE',
    PIECE_JOINTE_TELECHARGEE = 'PIECE_JOINTE_TELECHARGEE',
    RDV_CREE = 'RDV_CREE',
    RDV_DETAIL = 'RDV_DETAIL',
    RDV_LISTE = 'RDV_LISTE',
    RDV_MODIFIE = 'RDV_MODIFIE',
    RDV_SUPPRIME = 'RDV_SUPPRIME',
    PREFERENCES_MISES_A_JOUR = 'PREFERENCES_MISES_A_JOUR',
    RECHERCHE_ALTERNANCE_SAUVEGARDEE = 'RECHERCHE_ALTERNANCE_SAUVEGARDEE',
    RECHERCHE_IMMERSION_SAUVEGARDEE = 'RECHERCHE_IMMERSION_SAUVEGARDEE',
    RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE = 'RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE',
    RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE = 'RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE',
    SERVICE_CIVIQUE_RECHERCHE = 'SERVICE_CIVIQUE_RECHERCHE',
    SUIVI_POLE_EMPLOI = 'SUIVI_POLE_EMPLOI'
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
  [Evenement.Type.ACTION_DETAIL]: {
    categorie: 'Action',
    action: 'Consultation',
    nom: 'Détail'
  },
  [Evenement.Type.ACTION_LISTE]: {
    categorie: 'Action',
    action: 'Consultation',
    nom: 'Liste'
  },
  [Evenement.Type.ACTION_STATUT_MODIFIE]: {
    categorie: 'Action',
    action: 'Modification',
    nom: 'Statut'
  },
  [Evenement.Type.ACTION_SUPPRIMEE]: {
    categorie: 'Action',
    action: 'Suppression'
  },
  [Evenement.Type.ACTION_COMMENTEE]: {
    categorie: 'Action',
    action: 'Commentaire',
    nom: 'Ajout'
  },
  [Evenement.Type.ACTION_QUALIFIEE_SNP]: {
    categorie: 'Action',
    action: 'Qualifier',
    nom: 'SNP'
  },
  [Evenement.Type.ACTION_QUALIFIEE_NON_SNP]: {
    categorie: 'Action',
    action: 'Qualifier',
    nom: 'Non SNP'
  },
  [Evenement.Type.COMPTE_SUPPRIME]: {
    categorie: 'Compte',
    action: 'Suppression'
  },
  [Evenement.Type.COMPTE_ARCHIVE]: {
    categorie: 'Compte',
    action: 'Archivage'
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
  [Evenement.Type.MESSAGE_ENVOYE_MULTIPLE_PJ]: {
    categorie: 'Message',
    action: 'Envoi multiple PJ'
  },
  [Evenement.Type.MESSAGE_ENVOYE_PJ]: {
    categorie: 'Message',
    action: 'Envoi PJ'
  },
  [Evenement.Type.MESSAGE_OFFRE_PARTAGEE]: {
    categorie: 'Message',
    action: 'Partager',
    nom: 'Offre'
  },
  [Evenement.Type.RDV_CREE]: { categorie: 'Rendez-vous', action: 'Création' },
  [Evenement.Type.RDV_MODIFIE]: {
    categorie: 'Rendez-vous',
    action: 'Modification'
  },
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
  [Evenement.Type.SUIVI_POLE_EMPLOI]: {
    categorie: 'Suivi',
    action: 'Consulter',
    nom: 'Pôle emploi'
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
  },
  [Evenement.Type.RDV_LISTE]: {
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Liste'
  },
  [Evenement.Type.RDV_DETAIL]: {
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Détail'
  },
  [Evenement.Type.PIECE_JOINTE_TELECHARGEE]: {
    categorie: 'Message',
    action: 'Téléchargement PJ'
  },
  [Evenement.Type.PREFERENCES_MISES_A_JOUR]: {
    categorie: 'Préférences',
    action: 'Mise à jour'
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
