import { Inject, Injectable } from '@nestjs/common'
import { failure, Result } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { Authentification } from './authentification'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from './offre/recherche/suggestion/suggestion'
import {
  MauvaiseCommandeError,
  NonTraitableError
} from '../building-blocks/types/domain-error'
import { Recherche } from './offre/recherche/recherche'
import estAcceptee = Suggestion.estAcceptee
import estRefusee = Suggestion.estRefusee
import estTraitee = Suggestion.estTraitee

export const EvenementsRepositoryToken = 'EvenementsRepositoryToken'

export interface Evenement {
  utilisateur: Authentification.Utilisateur
  date: Date
  code: Evenement.Code
  categorie: string
  action: string
  nom?: string
}

export namespace Evenement {
  export enum Code {
    ACTION_CREEE = 'ACTION_CREEE',
    ACTION_CREEE_HORS_REFERENTIEL = 'ACTION_CREEE_HORS_REFERENTIEL',
    ACTION_CREEE_REFERENTIEL = 'ACTION_CREEE_REFERENTIEL',
    ACTION_DETAIL = 'ACTION_DETAIL',
    ACTION_LISTE = 'ACTION_LISTE',
    ACTION_STATUT_MODIFIE = 'ACTION_STATUT_MODIFIE',
    ACTION_SUPPRIMEE = 'ACTION_SUPPRIMEE',
    ACTION_COMMENTEE = 'ACTION_COMMENTEE',
    ACTION_QUALIFIEE_SNP = 'ACTION_QUALIFIEE_SNP',
    ACTION_QUALIFIEE_NON_SNP = 'ACTION_QUALIFIEE_NON_SNP',
    ANIMATION_COLLECTIVE_CREEE = 'ANIMATION_COLLECTIVE_CREEE',
    ANIMATION_COLLECTIVE_SUPPRIMEE = 'ANIMATION_COLLECTIVE_SUPPRIMEE',
    ANIMATION_COLLECTIVE_AFFICHEE = 'ANIMATION_COLLECTIVE_AFFICHEE',
    ANIMATION_COLLECTIVE_PARTAGEE = 'ANIMATION_COLLECTIVE_PARTAGEE',
    EVENEMENT_EXTERNE_RECHERCHE = 'EVENEMENT_EXTERNE_RECHERCHE',
    EVENEMENT_EXTERNE_DETAIL = 'EVENEMENT_EXTERNE_DETAIL',
    EVENEMENT_EXTERNE_PARTAGE = 'EVENEMENT_EXTERNE_PARTAGE',
    EVENEMENT_EXTERNE_PARTAGE_CONSEILLER = 'EVENEMENT_EXTERNE_PARTAGE_CONSEILLER',
    EVENEMENT_EXTERNE_INSCRIPTION = 'EVENEMENT_EXTERNE_INSCRIPTION',
    EVENEMENT_EXTERNE_MISE_EN_FAVORI = 'EVENEMENT_EXTERNE_MISE_EN_FAVORI',
    CV_PE_TELECHARGE = 'CV_PE_TELECHARGE',
    COMPTE_SUPPRIME = 'COMPTE_SUPPRIME',
    COMPTE_ARCHIVE = 'COMPTE_ARCHIVE',
    LISTE_DIFFUSION_CREEE = 'LISTE_DIFFUSION_CREEE',
    LISTE_DIFFUSION_MODIFIEE = 'LISTE_DIFFUSION_MODIFIEE',
    LISTE_DIFFUSION_SUPPRIMEE = 'LISTE_DIFFUSION_SUPPRIMEE',
    MESSAGE_ENVOYE = 'MESSAGE_ENVOYE',
    MESSAGE_ENVOYE_MULTIPLE_MANUEL = 'MESSAGE_ENVOYE_MULTIPLE_MANUEL',
    MESSAGE_ENVOYE_MULTIPLE_LISTE = 'MESSAGE_ENVOYE_MULTIPLE_LISTE',
    MESSAGE_ENVOYE_MULTIPLE_MIXTE = 'MESSAGE_ENVOYE_MULTIPLE_MIXTE',
    MESSAGE_ENVOYE_PJ = 'MESSAGE_ENVOYE_PJ',
    MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ = 'MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ',
    MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ = 'MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ',
    MESSAGE_ENVOYE_MULTIPLE_MIXTE_PJ = 'MESSAGE_ENVOYE_MULTIPLE_MIXTE_PJ',
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
    OFFRE_IMMERSION_PARTAGEE = 'OFFRE_IMMERSION_PARTAGEE',
    OFFRE_IMMERSION_APPEL = 'OFFRE_IMMERSION_APPEL',
    OFFRE_IMMERSION_ENVOI_EMAIL = 'OFFRE_IMMERSION_ENVOI_EMAIL',
    OFFRE_IMMERSION_ENVOI_FORMULAIRE = 'OFFRE_IMMERSION_ENVOI_FORMULAIRE',
    OFFRE_IMMERSION_LOCALISATION = 'OFFRE_IMMERSION_LOCALISATION',
    OFFRE_IMMERSION_RECHERCHEE = 'OFFRE_IMMERSION_RECHERCHEE',
    OFFRE_IMMERSION_SAUVEGARDEE = 'OFFRE_IMMERSION_SAUVEGARDEE',
    OFFRE_PARTAGEE = 'OFFRE_PARTAGEE',
    OFFRE_POSTULEE = 'OFFRE_POSTULEE',
    OFFRE_SERVICE_CIVIQUE_AFFICHE = 'OFFRE_SERVICE_CIVIQUE_AFFICHE',
    OFFRE_SERVICE_CIVIQUE_AFFICHEE = 'OFFRE_SERVICE_CIVIQUE_AFFICHEE',
    OFFRE_SERVICE_CIVIQUE_PARTAGEE = 'OFFRE_SERVICE_CIVIQUE_PARTAGEE',
    OFFRE_SERVICE_CIVIQUE_POSTULEE = 'OFFRE_SERVICE_CIVIQUE_POSTULEE',
    OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE = 'OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE',
    OFFRE_SERVICE_CIVIQUE_RECHERCHEE = 'OFFRE_SERVICE_CIVIQUE_RECHERCHEE',
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
    SUGGESTION_EMPLOI_ACCEPTEE = 'SUGGESTION_EMPLOI_ACCEPTEE',
    SUGGESTION_ALTERNANCE_ACCEPTEE = 'SUGGESTION_ALTERNANCE_ACCEPTEE',
    SUGGESTION_IMMERSION_ACCEPTEE = 'SUGGESTION_IMMERSION_ACCEPTEE',
    SUGGESTION_SERVICE_CIVIQUE_ACCEPTEE = 'SUGGESTION_SERVICE_CIVIQUE_ACCEPTEE',
    SUGGESTION_EMPLOI_REFUSEE = 'SUGGESTION_EMPLOI_REFUSEE',
    SUGGESTION_ALTERNANCE_REFUSEE = 'SUGGESTION_ALTERNANCE_REFUSEE',
    SUGGESTION_IMMERSION_REFUSEE = 'SUGGESTION_IMMERSION_REFUSEE',
    SUGGESTION_SERVICE_CIVIQUE_REFUSEE = 'SUGGESTION_SERVICE_CIVIQUE_REFUSEE',
    SUGGESTION_EMPLOI_CONSEILLER_ACCEPTEE = 'SUGGESTION_EMPLOI_CONSEILLER_ACCEPTEE',
    SUGGESTION_ALTERNANCE_CONSEILLER_ACCEPTEE = 'SUGGESTION_ALTERNANCE_CONSEILLER_ACCEPTEE',
    SUGGESTION_IMMERSION_CONSEILLER_ACCEPTEE = 'SUGGESTION_IMMERSION_CONSEILLER_ACCEPTEE',
    SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_ACCEPTEE = 'SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_ACCEPTEE',
    SUGGESTION_EMPLOI_CONSEILLER_REFUSEE = 'SUGGESTION_EMPLOI_CONSEILLER_REFUSEE',
    SUGGESTION_ALTERNANCE_CONSEILLER_REFUSEE = 'SUGGESTION_ALTERNANCE_CONSEILLER_REFUSEE',
    SUGGESTION_IMMERSION_CONSEILLER_REFUSEE = 'SUGGESTION_IMMERSION_CONSEILLER_REFUSEE',
    SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_REFUSEE = 'SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_REFUSEE',
    SUGGESTION_EMPLOI_PROFIL_PE_ACCEPTEE = 'SUGGESTION_EMPLOI_PROFIL_PE_ACCEPTEE',
    SUGGESTION_ALTERNANCE_PROFIL_PE_ACCEPTEE = 'SUGGESTION_ALTERNANCE_PROFIL_PE_ACCEPTEE',
    SUGGESTION_IMMERSION_PROFIL_PE_ACCEPTEE = 'SUGGESTION_IMMERSION_PROFIL_PE_ACCEPTEE',
    SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_ACCEPTEE = 'SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_ACCEPTEE',
    SUGGESTION_EMPLOI_PROFIL_PE_REFUSEE = 'SUGGESTION_EMPLOI_PROFIL_PE_REFUSEE',
    SUGGESTION_ALTERNANCE_PROFIL_PE_REFUSEE = 'SUGGESTION_ALTERNANCE_PROFIL_PE_REFUSEE',
    SUGGESTION_IMMERSION_PROFIL_PE_REFUSEE = 'SUGGESTION_IMMERSION_PROFIL_PE_REFUSEE',
    SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_REFUSEE = 'SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_REFUSEE',
    RECHERCHE_EMPLOI_SUGGEREE = 'RECHERCHE_EMPLOI_SUGGEREE',
    RECHERCHE_ALTERNANCE_SUGGEREE = 'RECHERCHE_ALTERNANCE_SUGGEREE',
    RECHERCHE_IMMERSION_SUGGEREE = 'RECHERCHE_IMMERSION_SUGGEREE',
    RECHERCHE_SERVICE_CIVIQUE_SUGGEREE = 'RECHERCHE_SERVICE_CIVIQUE_SUGGEREE',
    RECHERCHE_EMPLOI_SUPPRIMEE = 'RECHERCHE_EMPLOI_SUPPRIMEE',
    RECHERCHE_ALTERNANCE_SUPPRIMEE = 'RECHERCHE_ALTERNANCE_SUPPRIMEE',
    RECHERCHE_IMMERSION_SUPPRIMEE = 'RECHERCHE_IMMERSION_SUPPRIMEE',
    RECHERCHE_SERVICE_CIVIQUE_SUPPRIMEE = 'RECHERCHE_SERVICE_CIVIQUE_SUPPRIMEE',
    SUIVI_POLE_EMPLOI = 'SUIVI_POLE_EMPLOI'
  }

  export interface Repository {
    save(evenement: Evenement): Promise<Result>
  }
}

const evenements: {
  [key in Evenement.Code]: { categorie: string; action: string; nom?: string }
} = {
  [Evenement.Code.ACTION_CREEE]: {
    categorie: 'Action',
    action: 'Création'
  },
  [Evenement.Code.ACTION_CREEE_HORS_REFERENTIEL]: {
    categorie: 'Action',
    action: 'Création',
    nom: 'Hors référentiel'
  },
  [Evenement.Code.ACTION_CREEE_REFERENTIEL]: {
    categorie: 'Action',
    action: 'Création',
    nom: 'Référentiel'
  },
  [Evenement.Code.ACTION_DETAIL]: {
    categorie: 'Action',
    action: 'Consultation',
    nom: 'Détail'
  },
  [Evenement.Code.ACTION_LISTE]: {
    categorie: 'Action',
    action: 'Consultation',
    nom: 'Liste'
  },
  [Evenement.Code.ACTION_STATUT_MODIFIE]: {
    categorie: 'Action',
    action: 'Modification',
    nom: 'Statut'
  },
  [Evenement.Code.ACTION_SUPPRIMEE]: {
    categorie: 'Action',
    action: 'Suppression'
  },
  [Evenement.Code.ACTION_COMMENTEE]: {
    categorie: 'Action',
    action: 'Commentaire',
    nom: 'Ajout'
  },
  [Evenement.Code.ACTION_QUALIFIEE_SNP]: {
    categorie: 'Action',
    action: 'Qualifier',
    nom: 'SNP'
  },
  [Evenement.Code.ACTION_QUALIFIEE_NON_SNP]: {
    categorie: 'Action',
    action: 'Qualifier',
    nom: 'Non SNP'
  },
  [Evenement.Code.ANIMATION_COLLECTIVE_CREEE]: {
    categorie: 'Rendez-vous',
    action: 'Création',
    nom: 'Animation collective'
  },
  [Evenement.Code.ANIMATION_COLLECTIVE_SUPPRIMEE]: {
    categorie: 'Rendez-vous',
    action: 'Suppression',
    nom: 'Animation collective'
  },
  [Evenement.Code.ANIMATION_COLLECTIVE_AFFICHEE]: {
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Animation collective'
  },
  [Evenement.Code.ANIMATION_COLLECTIVE_PARTAGEE]: {
    categorie: 'Rendez-vous',
    action: 'Partage',
    nom: 'Animation collective'
  },
  [Evenement.Code.EVENEMENT_EXTERNE_RECHERCHE]: {
    categorie: 'Evénement',
    action: 'Recherche',
    nom: 'Externe'
  },
  [Evenement.Code.EVENEMENT_EXTERNE_DETAIL]: {
    categorie: 'Evénement',
    action: 'Détail',
    nom: 'Externe'
  },
  [Evenement.Code.EVENEMENT_EXTERNE_PARTAGE]: {
    categorie: 'Evénement',
    action: 'Partage',
    nom: 'Externe'
  },
  [Evenement.Code.EVENEMENT_EXTERNE_PARTAGE_CONSEILLER]: {
    categorie: 'Evénement',
    action: 'Partage conseiller',
    nom: 'Externe'
  },
  [Evenement.Code.EVENEMENT_EXTERNE_INSCRIPTION]: {
    categorie: 'Evénement',
    action: 'Inscription',
    nom: 'Externe'
  },
  [Evenement.Code.EVENEMENT_EXTERNE_MISE_EN_FAVORI]: {
    categorie: 'Evénement',
    action: 'Favoris',
    nom: 'Externe'
  },
  [Evenement.Code.COMPTE_SUPPRIME]: {
    categorie: 'Compte',
    action: 'Suppression'
  },
  [Evenement.Code.COMPTE_ARCHIVE]: {
    categorie: 'Compte',
    action: 'Archivage'
  },
  [Evenement.Code.LISTE_DIFFUSION_CREEE]: {
    categorie: 'Liste de diffusion',
    action: 'Création'
  },
  [Evenement.Code.LISTE_DIFFUSION_MODIFIEE]: {
    categorie: 'Liste de diffusion',
    action: 'Modification'
  },
  [Evenement.Code.LISTE_DIFFUSION_SUPPRIMEE]: {
    categorie: 'Liste de diffusion',
    action: 'Suppression'
  },
  [Evenement.Code.OFFRE_EMPLOI_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Emploi'
  },
  [Evenement.Code.OFFRE_EMPLOI_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Emploi'
  },
  [Evenement.Code.OFFRE_EMPLOI_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Emploi'
  },
  [Evenement.Code.OFFRE_EMPLOI_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Emploi'
  },
  [Evenement.Code.OFFRE_EMPLOI_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Emploi'
  },
  [Evenement.Code.OFFRE_IMMERSION_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_APPEL]: {
    categorie: 'Offre',
    action: 'Appel',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_ENVOI_EMAIL]: {
    categorie: 'Offre',
    action: 'Envoi email',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_ENVOI_FORMULAIRE]: {
    categorie: 'Offre',
    action: 'Envoi formulaire',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_IMMERSION_LOCALISATION]: {
    categorie: 'Offre',
    action: 'Localiser',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_ALTERNANCE_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Alternance'
  },
  [Evenement.Code.OFFRE_ALTERNANCE_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Alternance'
  },
  [Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Alternance'
  },
  [Evenement.Code.OFFRE_ALTERNANCE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Alternance'
  },
  [Evenement.Code.OFFRE_ALTERNANCE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Alternance'
  },
  [Evenement.Code.OFFRE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partager'
  },
  [Evenement.Code.OFFRE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler'
  },
  [Evenement.Code.CV_PE_TELECHARGE]: {
    categorie: 'Offre',
    action: 'Téléchargement CV',
    nom: 'PE'
  },
  [Evenement.Code.MESSAGE_ENVOYE]: { categorie: 'Message', action: 'Envoi' },
  [Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL]: {
    categorie: 'Message',
    action: 'Envoi multiple',
    nom: 'Manuel'
  },
  [Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_LISTE]: {
    categorie: 'Message',
    action: 'Envoi multiple',
    nom: 'Liste'
  },
  [Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE]: {
    categorie: 'Message',
    action: 'Envoi multiple',
    nom: 'Manuel+Liste'
  },
  [Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ]: {
    categorie: 'Message',
    action: 'Envoi multiple PJ',
    nom: 'Manuel'
  },
  [Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ]: {
    categorie: 'Message',
    action: 'Envoi multiple PJ',
    nom: 'Liste'
  },
  [Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE_PJ]: {
    categorie: 'Message',
    action: 'Envoi multiple PJ',
    nom: 'Manuel+liste'
  },
  [Evenement.Code.MESSAGE_ENVOYE_PJ]: {
    categorie: 'Message',
    action: 'Envoi PJ'
  },
  [Evenement.Code.MESSAGE_OFFRE_PARTAGEE]: {
    categorie: 'Message',
    action: 'Partage',
    nom: 'Offre'
  },
  [Evenement.Code.RDV_CREE]: { categorie: 'Rendez-vous', action: 'Création' },
  [Evenement.Code.RDV_MODIFIE]: {
    categorie: 'Rendez-vous',
    action: 'Modification'
  },
  [Evenement.Code.RDV_SUPPRIME]: {
    categorie: 'Rendez-vous',
    action: 'Suppression'
  },
  [Evenement.Code.RECHERCHE_OFFRE_EMPLOI_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Emploi'
  },
  [Evenement.Code.RECHERCHE_ALTERNANCE_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Alternance'
  },
  [Evenement.Code.RECHERCHE_IMMERSION_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Immersion'
  },
  [Evenement.Code.OFFRE_SERVICE_CIVIQUE_RECHERCHEE]: {
    categorie: 'Offre',
    action: 'Recherche',
    nom: 'Service Civique'
  },
  [Evenement.Code.SUIVI_POLE_EMPLOI]: {
    categorie: 'Suivi',
    action: 'Consulter',
    nom: 'Pôle emploi'
  },
  [Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Service Civique'
  },
  [Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHEE]: {
    categorie: 'Offre',
    action: 'Détail',
    nom: 'Service Civique'
  },
  [Evenement.Code.OFFRE_SERVICE_CIVIQUE_POSTULEE]: {
    categorie: 'Offre',
    action: 'Postuler',
    nom: 'Service Civique'
  },
  [Evenement.Code.OFFRE_SERVICE_CIVIQUE_PARTAGEE]: {
    categorie: 'Offre',
    action: 'Partage',
    nom: 'Service Civique'
  },
  [Evenement.Code.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE]: {
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Service Civique'
  },
  [Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SAUVEGARDEE]: {
    categorie: 'Recherche',
    action: 'Enregistrer',
    nom: 'Service Civique'
  },
  [Evenement.Code.RDV_LISTE]: {
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Liste'
  },
  [Evenement.Code.RDV_DETAIL]: {
    categorie: 'Rendez-vous',
    action: 'Consultation',
    nom: 'Détail'
  },
  [Evenement.Code.PIECE_JOINTE_TELECHARGEE]: {
    categorie: 'Message',
    action: 'Ouverture PJ'
  },
  [Evenement.Code.PREFERENCES_MISES_A_JOUR]: {
    categorie: 'Préférences',
    action: 'Mise à jour'
  },
  [Evenement.Code.SUGGESTION_EMPLOI_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter',
    nom: 'Emploi'
  },
  [Evenement.Code.SUGGESTION_ALTERNANCE_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter',
    nom: 'Alternance'
  },
  [Evenement.Code.SUGGESTION_IMMERSION_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter',
    nom: 'Immersion'
  },
  [Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter',
    nom: 'Service Civique'
  },
  [Evenement.Code.SUGGESTION_EMPLOI_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser',
    nom: 'Emploi'
  },
  [Evenement.Code.SUGGESTION_ALTERNANCE_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser',
    nom: 'Alternance'
  },
  [Evenement.Code.SUGGESTION_IMMERSION_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser',
    nom: 'Immersion'
  },
  [Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser',
    nom: 'Service Civique'
  },
  [Evenement.Code.SUGGESTION_EMPLOI_CONSEILLER_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Conseiller',
    nom: 'Emploi'
  },
  [Evenement.Code.SUGGESTION_ALTERNANCE_CONSEILLER_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Conseiller',
    nom: 'Alternance'
  },
  [Evenement.Code.SUGGESTION_IMMERSION_CONSEILLER_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Conseiller',
    nom: 'Immersion'
  },
  [Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Conseiller',
    nom: 'Service Civique'
  },
  [Evenement.Code.SUGGESTION_EMPLOI_CONSEILLER_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Conseiller',
    nom: 'Emploi'
  },
  [Evenement.Code.SUGGESTION_ALTERNANCE_CONSEILLER_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Conseiller',
    nom: 'Alternance'
  },
  [Evenement.Code.SUGGESTION_IMMERSION_CONSEILLER_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Conseiller',
    nom: 'Immersion'
  },
  [Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_REFUSEE]: {
    categorie: 'Recherche',
    action: 'Refuser - Conseiller',
    nom: 'Service Civique'
  },
  [Evenement.Code.SUGGESTION_EMPLOI_PROFIL_PE_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Profil PE',
    nom: 'Emploi'
  },
  [Evenement.Code.SUGGESTION_ALTERNANCE_PROFIL_PE_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Profil PE',
    nom: 'Alternance'
  },
  [Evenement.Code.SUGGESTION_IMMERSION_PROFIL_PE_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Profil PE',
    nom: 'Immersion'
  },
  [Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_ACCEPTEE]: {
    categorie: 'Suggestion',
    action: 'Accepter - Profil PE',
    nom: 'Service Civique'
  },
  [Evenement.Code.SUGGESTION_EMPLOI_PROFIL_PE_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Profil PE',
    nom: 'Emploi'
  },
  [Evenement.Code.SUGGESTION_ALTERNANCE_PROFIL_PE_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Profil PE',
    nom: 'Alternance'
  },
  [Evenement.Code.SUGGESTION_IMMERSION_PROFIL_PE_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Profil PE',
    nom: 'Immersion'
  },
  [Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_REFUSEE]: {
    categorie: 'Suggestion',
    action: 'Refuser - Profil PE',
    nom: 'Service Civique'
  },
  [Evenement.Code.RECHERCHE_EMPLOI_SUGGEREE]: {
    categorie: 'Recherche',
    action: 'Partage',
    nom: 'Emploi'
  },
  [Evenement.Code.RECHERCHE_ALTERNANCE_SUGGEREE]: {
    categorie: 'Recherche',
    action: 'Partage',
    nom: 'Alternance'
  },
  [Evenement.Code.RECHERCHE_IMMERSION_SUGGEREE]: {
    categorie: 'Recherche',
    action: 'Partage',
    nom: 'Immersion'
  },
  [Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SUGGEREE]: {
    categorie: 'Recherche',
    action: 'Partage',
    nom: 'Service Civique'
  },
  [Evenement.Code.RECHERCHE_EMPLOI_SUPPRIMEE]: {
    categorie: 'Recherche',
    action: 'Supprimer',
    nom: 'Emploi'
  },
  [Evenement.Code.RECHERCHE_ALTERNANCE_SUPPRIMEE]: {
    categorie: 'Recherche',
    action: 'Supprimer',
    nom: 'Alternance'
  },
  [Evenement.Code.RECHERCHE_IMMERSION_SUPPRIMEE]: {
    categorie: 'Recherche',
    action: 'Supprimer',
    nom: 'Immersion'
  },
  [Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SUPPRIMEE]: {
    categorie: 'Recherche',
    action: 'Supprimer',
    nom: 'Service Civique'
  }
}

@Injectable()
export class EvenementService {
  constructor(
    @Inject(EvenementsRepositoryToken)
    private evenementRepository: Evenement.Repository,
    private dateService: DateService,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository
  ) {}

  async creer(
    code: Evenement.Code,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const libelles: { categorie: string; action: string; nom?: string } =
      evenements[code]

    await this.evenementRepository.save({
      ...libelles,
      utilisateur,
      code,
      date: this.dateService.nowJs()
    })
  }

  async creerEvenementSuggestion(
    utilisateur: Authentification.Utilisateur,
    idSuggestion: string
  ): Promise<void> {
    const suggestion = await this.suggestionRepository.get(idSuggestion)

    if (!suggestion) {
      throw failure(new MauvaiseCommandeError('Suggestion non trouvée'))
    }

    if (estTraitee(suggestion)) {
      await this.creer(fromSuggestionToCodeEvenement(suggestion), utilisateur)
    }
  }
}

function fromSuggestionToCodeEvenement(suggestion: Suggestion): Evenement.Code {
  if (estAcceptee(suggestion)) {
    switch (suggestion.type) {
      case Recherche.Type.OFFRES_EMPLOI:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_EMPLOI_PROFIL_PE_ACCEPTEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code.SUGGESTION_EMPLOI_CONSEILLER_ACCEPTEE
          }
        }
        break
      case Recherche.Type.OFFRES_IMMERSION:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_IMMERSION_PROFIL_PE_ACCEPTEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code.SUGGESTION_IMMERSION_CONSEILLER_ACCEPTEE
          }
        }
        break
      case Recherche.Type.OFFRES_ALTERNANCE:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_ALTERNANCE_PROFIL_PE_ACCEPTEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code.SUGGESTION_ALTERNANCE_CONSEILLER_ACCEPTEE
          }
        }
        break
      case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code
                .SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_ACCEPTEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code
                .SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_ACCEPTEE
          }
        }
        break
    }
  }
  if (estRefusee(suggestion)) {
    switch (suggestion.type) {
      case Recherche.Type.OFFRES_EMPLOI:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_EMPLOI_PROFIL_PE_REFUSEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code.SUGGESTION_EMPLOI_CONSEILLER_REFUSEE
          }
        }
        break
      case Recherche.Type.OFFRES_IMMERSION:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_IMMERSION_PROFIL_PE_REFUSEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code.SUGGESTION_IMMERSION_CONSEILLER_REFUSEE
          }
        }
        break
      case Recherche.Type.OFFRES_ALTERNANCE:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_ALTERNANCE_PROFIL_PE_REFUSEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code.SUGGESTION_ALTERNANCE_CONSEILLER_REFUSEE
          }
        }
        break
      case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
        {
          switch (suggestion.source) {
            case Suggestion.Source.POLE_EMPLOI:
              return Evenement.Code.SUGGESTION_SERVICE_CIVIQUE_PROFIL_PE_REFUSEE
            case Suggestion.Source.CONSEILLER:
              return Evenement.Code
                .SUGGESTION_SERVICE_CIVIQUE_CONSEILLER_REFUSEE
          }
        }
        break
    }
  }
  throw failure(new NonTraitableError('Suggestion', suggestion.id))
}
