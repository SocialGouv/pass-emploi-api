import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  ConseillerSansAgenceError,
  JeuneNonLieALAgenceError,
  JeuneNonLieAuConseillerError,
  MauvaiseCommandeError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { IdService } from '../../utils/id-service'
import { Conseiller } from '../conseiller/conseiller'
import { Jeune } from '../jeune/jeune'
import * as _AnimationCollective from './animation-collective'
import * as _Historique from './historique'

export const RendezVousRepositoryToken = 'RendezVous.Repository'

export enum CodeTypeRendezVous {
  ACTIVITE_EXTERIEURES = 'ACTIVITE_EXTERIEURES',
  ATELIER = 'ATELIER',
  ENTRETIEN_INDIVIDUEL_CONSEILLER = 'ENTRETIEN_INDIVIDUEL_CONSEILLER',
  ENTRETIEN_PARTENAIRE = 'ENTRETIEN_PARTENAIRE',
  INFORMATION_COLLECTIVE = 'INFORMATION_COLLECTIVE',
  VISITE = 'VISITE',
  PRESTATION = 'PRESTATION',
  AUTRE = 'AUTRE',
  RENDEZ_VOUS_MILO = 'RENDEZ_VOUS_MILO',
  SESSION_MILO = 'SESSION_MILO'
}

export const mapCodeLabelTypeRendezVous: Record<CodeTypeRendezVous, string> = {
  ACTIVITE_EXTERIEURES: 'Activités extérieures',
  ATELIER: 'Atelier',
  ENTRETIEN_INDIVIDUEL_CONSEILLER: 'Entretien individuel conseiller',
  ENTRETIEN_PARTENAIRE: 'Entretien par un partenaire',
  INFORMATION_COLLECTIVE: 'Information collective',
  VISITE: 'Visite',
  PRESTATION: 'Prestation',
  AUTRE: 'Autre',
  RENDEZ_VOUS_MILO: 'Rendez-vous i-milo',
  SESSION_MILO: 'Inscription à une session i-milo'
}

export const mapCodeLabelTypeRendezVousJeune: Record<
  CodeTypeRendezVous,
  string
> = {
  ACTIVITE_EXTERIEURES: 'Activités extérieures',
  ATELIER: 'Atelier',
  ENTRETIEN_INDIVIDUEL_CONSEILLER: 'Entretien individuel conseiller',
  ENTRETIEN_PARTENAIRE: 'Entretien par un partenaire',
  INFORMATION_COLLECTIVE: 'Information collective',
  VISITE: 'Visite',
  PRESTATION: 'Prestation',
  AUTRE: 'Autre',
  RENDEZ_VOUS_MILO: 'Rendez-vous',
  SESSION_MILO: 'Animation collective'
}

export interface TypeRendezVous {
  code: CodeTypeRendezVous
  label: string
}

export interface Createur {
  id: string
  nom: string
  prenom: string
}

export type JeuneDuRendezVous = Pick<
  Jeune,
  'id' | 'firstName' | 'lastName' | 'conseiller' | 'email' | 'configuration'
>

export interface RendezVous {
  id: string
  source: RendezVous.Source
  titre: string
  sousTitre: string
  commentaire?: string
  modalite?: string
  date: Date
  duree: number
  jeunes: JeuneDuRendezVous[]
  type: CodeTypeRendezVous
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
  invitation?: boolean
  icsSequence?: number
  createur: Createur
  idAgence?: string
  dateCloture?: DateTime
  informationsPartenaire?: RendezVous.InformationsPartenaire
  nombreMaxParticipants?: number
}

export interface InfosRendezVousACreer {
  idsJeunes: string[]
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  titre?: string
  type?: string
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller?: boolean
  invitation?: boolean
  nombreMaxParticipants?: number
}

export interface InfosRendezVousAMettreAJour {
  titre?: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  jeunes: JeuneDuRendezVous[]
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
  nombreMaxParticipants?: number
}

export namespace RendezVous {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import AnimationCollective = _AnimationCollective.AnimationCollective
  // FIXME: le linter ne comprend pas cette technique 🤷‍️
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Historique = _Historique.Historique

  export interface Repository {
    save(rendezVous: RendezVous): Promise<void>

    get(id: string): Promise<RendezVous | undefined>

    getByIdPartenaire(
      idRendezVousPartenaire: string,
      typeRendezVousPartenaire: string
    ): Promise<RendezVous | undefined>

    delete(idRendezVous: string): Promise<void>

    getAllAVenir(): Promise<RendezVous[]>
  }

  export enum Periode {
    PASSES = 'PASSES',
    FUTURS = 'FUTURS'
  }

  export enum Operation {
    CREATION = 'CREATION',
    MODIFICATION = 'MODIFICATION',
    SUPPRESSION = 'SUPPRESSION'
  }

  export enum Source {
    PASS_EMPLOI = 'PASS_EMPLOI',
    MILO = 'MILO',
    POLE_EMPLOI = 'POLE_EMPLOI'
  }

  export interface InformationsPartenaire {
    id: string
    type: string
  }

  export function estUnTypeAnimationCollective(type?: string): boolean {
    return (
      Boolean(type) &&
      (type === CodeTypeRendezVous.ATELIER ||
        type === CodeTypeRendezVous.INFORMATION_COLLECTIVE)
    )
  }

  export function estUnTypeCEJ(type?: string): boolean {
    return (
      type !== CodeTypeRendezVous.SESSION_MILO &&
      type !== CodeTypeRendezVous.RENDEZ_VOUS_MILO
    )
  }

  @Injectable()
  export class Factory {
    constructor(private idService: IdService) {}

    creer(
      infosRendezVousACreer: InfosRendezVousACreer,
      jeunes: Jeune[],
      conseiller: Conseiller
    ): Result<RendezVous> {
      if (!estUnTypeCEJ(infosRendezVousACreer.type)) {
        return failure(
          new MauvaiseCommandeError('Le type de rendez-vous est invalide')
        )
      }

      if (RendezVous.estUnTypeAnimationCollective(infosRendezVousACreer.type)) {
        if (
          infosRendezVousACreer.nombreMaxParticipants &&
          infosRendezVousACreer.nombreMaxParticipants < jeunes.length
        ) {
          return failure(
            new MauvaiseCommandeError(
              'Le nombre de participants ne peut excéder la limite renseignée.'
            )
          )
        }
        if (!conseiller.agence?.id) {
          return failure(new ConseillerSansAgenceError(conseiller.id))
        }
      } else {
        if (infosRendezVousACreer.nombreMaxParticipants) {
          return failure(
            new MauvaiseCommandeError(
              'Le champ nombreMaxParticipants ne concerne que les animations collectives.'
            )
          )
        }
      }

      for (const jeune of jeunes) {
        if (
          RendezVous.estUnTypeAnimationCollective(infosRendezVousACreer.type)
        ) {
          if (jeune.conseiller?.idAgence !== conseiller.agence?.id) {
            return failure(
              new JeuneNonLieALAgenceError(jeune.id, conseiller.agence!.id!)
            )
          }
        } else if (jeune.conseiller?.id !== conseiller.id) {
          return failure(
            new JeuneNonLieAuConseillerError(conseiller.id, jeune.id)
          )
        }
      }

      return success({
        id: this.idService.uuid(),
        source: Source.PASS_EMPLOI,
        commentaire: infosRendezVousACreer.commentaire,
        duree: infosRendezVousACreer.duree,
        date: new Date(infosRendezVousACreer.date),
        modalite: infosRendezVousACreer.modalite,
        jeunes: jeunes,
        titre: infosRendezVousACreer.titre ?? 'Rendez-vous conseiller',
        sousTitre: `avec ${conseiller.firstName}`,
        type: infosRendezVousACreer.type
          ? (infosRendezVousACreer.type as CodeTypeRendezVous)
          : CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
        precision: infosRendezVousACreer.precision,
        adresse: infosRendezVousACreer.adresse,
        organisme: infosRendezVousACreer.organisme,
        invitation: infosRendezVousACreer.invitation,
        presenceConseiller:
          infosRendezVousACreer.presenceConseiller === undefined
            ? true
            : infosRendezVousACreer.presenceConseiller,
        createur: {
          id: conseiller.id,
          nom: conseiller.lastName,
          prenom: conseiller.firstName
        },
        idAgence: estUnTypeAnimationCollective(infosRendezVousACreer.type)
          ? conseiller.agence?.id
          : undefined,
        nombreMaxParticipants: infosRendezVousACreer.nombreMaxParticipants
      })
    }
  }

  @Injectable()
  export class Service {
    mettreAJour(
      rendezVousInitial: RendezVous,
      infosRendezVousAMettreAJour: InfosRendezVousAMettreAJour
    ): Result<RendezVous> {
      if (RendezVous.estUnTypeAnimationCollective(rendezVousInitial.type)) {
        if (RendezVous.AnimationCollective.estCloturee(rendezVousInitial)) {
          return failure(
            new MauvaiseCommandeError(
              'Une Animation Collective clôturée ne peut plus être modifiée.'
            )
          )
        }
        if (
          infosRendezVousAMettreAJour.nombreMaxParticipants &&
          infosRendezVousAMettreAJour.nombreMaxParticipants <
            infosRendezVousAMettreAJour.jeunes.length
        ) {
          return failure(
            new MauvaiseCommandeError(
              'Le nombre de participants ne peut excéder la limite renseignée.'
            )
          )
        }
      } else {
        if (infosRendezVousAMettreAJour.jeunes.length === 0) {
          return failure(
            new MauvaiseCommandeError('Un bénéficiaire minimum est requis.')
          )
        }
        if (
          !infosRendezVousAMettreAJour.presenceConseiller &&
          rendezVousInitial.type ===
            CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
        ) {
          return failure(
            new MauvaiseCommandeError(
              'Le champ presenceConseiller ne peut être modifié pour un rendez-vous Conseiller.'
            )
          )
        }
        if (infosRendezVousAMettreAJour.nombreMaxParticipants) {
          return failure(
            new MauvaiseCommandeError(
              'Le champ nombreMaxParticipants ne concerne que les animations collectives.'
            )
          )
        }
      }

      return success({
        ...rendezVousInitial,
        titre: infosRendezVousAMettreAJour.titre ?? rendezVousInitial.titre,
        commentaire: infosRendezVousAMettreAJour.commentaire,
        date: new Date(infosRendezVousAMettreAJour.date),
        duree: infosRendezVousAMettreAJour.duree,
        modalite: infosRendezVousAMettreAJour.modalite,
        jeunes: infosRendezVousAMettreAJour.jeunes,
        adresse: infosRendezVousAMettreAJour.adresse,
        organisme: infosRendezVousAMettreAJour.organisme,
        presenceConseiller: infosRendezVousAMettreAJour.presenceConseiller,
        nombreMaxParticipants: infosRendezVousAMettreAJour.nombreMaxParticipants
      })
    }
  }
}
