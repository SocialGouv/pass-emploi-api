import { OffreEmploiResumeQueryModel } from 'src/application/queries/query-models/offres-emploi.query-model'
import { OffreEmploi } from '../../src/domain/offre-emploi'
import {
  NotificationsPartenairesDto,
  OffreEmploiDto,
  TypeRDVPE
} from '../../src/infrastructure/repositories/dto/pole-emploi.dto'

export const uneOffreEmploi = (): OffreEmploi => ({
  id: '123DXPM',
  titre: 'Technicien / Technicienne en froid et climatisation',
  typeContrat: 'MIS',
  nomEntreprise: 'RH TT INTERIM',
  duree: 'Temps plein',
  localisation: {
    nom: '77 - LOGNES',
    codePostal: '77185',
    commune: '77258'
  },
  alternance: false
})

export const uneOffreEmploiDto = (): OffreEmploiDto => ({
  id: '123DXPM',
  intitule: 'Technicien / Technicienne en froid et climatisation',
  typeContrat: 'MIS',
  dureeTravailLibelleConverti: 'Temps plein',
  entreprise: {
    nom: 'RH TT INTERIM'
  },
  lieuTravail: {
    libelle: 'libelle',
    codePostal: '57000',
    commune: '57463'
  },
  contact: {
    urlPostulation: 'url/postulation'
  },
  origineOffre: {
    urlOrigine: 'url/offre',
    partenaires: []
  },
  alternance: false
})

export const uneOffreEmploiResumeQueryModel =
  (): OffreEmploiResumeQueryModel => ({
    id: '123DXPM',
    titre: 'Technicien / Technicienne en froid et climatisation',
    typeContrat: 'MIS',
    nomEntreprise: 'RH TT INTERIM',
    duree: 'Temps plein',
    localisation: {
      nom: '77 - LOGNES',
      codePostal: '77185',
      commune: '77258'
    },
    alternance: false
  })

export const notificationsRDVPEDto = (): NotificationsPartenairesDto => ({
  listeNotificationsPartenaires: [
    {
      idExterneDE: 'string',
      notifications: [
        {
          idNotification: 'string',
          codeNotification: 'string',
          message: 'string',
          typeMouvementRDV: TypeRDVPE.CREA,
          typeRDV: 'string',
          dateCreation: 'string',
          idMetier: 'string'
        }
      ]
    }
  ]
})
