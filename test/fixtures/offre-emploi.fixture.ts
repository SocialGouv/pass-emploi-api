import { OffreEmploiResumeQueryModel } from 'src/application/queries/query-models/offres-emploi.query-model'
import { OffreEmploi } from '../../src/domain/offre-emploi'
import {
  NotificationsPartenairesDto,
  OffreEmploiDto,
  TypeRDVPE
} from '../../src/infrastructure/repositories/dto/pole-emploi.dto'

export const uneOffreEmploi = (
  args: Partial<OffreEmploi> = {}
): OffreEmploi => {
  const defaults: OffreEmploi = {
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
  }

  return { ...defaults, ...args }
}

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
          message:
            'Un nouveau rendez-vous est positionn√© au 18/08/2022 16:30.',
          typeRDV: 'PRESTATIONS',
          idMetier: '92dc7deb-3580-4e5c-af1c-23e9af0ecd07',
          dateCreation: 'Fri Aug 12 13:58:50 CEST 2022',
          idNotification: 'b1d84a42ba884b35881e118132825992',
          codeNotification: 'INSC_RDV_PRESTA',
          typeMouvementRDV: TypeRDVPE.CREA
        }
      ]
    }
  ]
})
