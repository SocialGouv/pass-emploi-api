import { DateTime } from 'luxon'
import { IdService } from '../../utils/id-service'
import { Conseiller } from '../conseiller'
import { Jeune } from '../jeune/jeune'
import * as _AnimationCollective from './animation-collective'
import * as _Historique from './historique'
import { failure, Result, success } from '../../building-blocks/types/result'
import {
  ConseillerSansAgenceError,
  JeuneNonLieAuConseillerError,
  MauvaiseCommandeError
} from '../../building-blocks/types/domain-error'
import { Injectable } from '@nestjs/common'

export const RendezVousRepositoryToken = 'RendezVous.Repository'

export enum CodeTypeRendezVous {
  ACTIVITE_EXTERIEURES = 'ACTIVITE_EXTERIEURES',
  ATELIER = 'ATELIER',
  ENTRETIEN_INDIVIDUEL_CONSEILLER = 'ENTRETIEN_INDIVIDUEL_CONSEILLER',
  ENTRETIEN_PARTENAIRE = 'ENTRETIEN_PARTENAIRE',
  INFORMATION_COLLECTIVE = 'INFORMATION_COLLECTIVE',
  VISITE = 'VISITE',
  PRESTATION = 'PRESTATION',
  AUTRE = 'AUTRE'
}

export const mapCodeLabelTypeRendezVous: Record<CodeTypeRendezVous, string> = {
  ACTIVITE_EXTERIEURES: 'Activités extérieures',
  ATELIER: 'Atelier',
  ENTRETIEN_INDIVIDUEL_CONSEILLER: 'Entretien individuel conseiller',
  ENTRETIEN_PARTENAIRE: 'Entretien par un partenaire',
  INFORMATION_COLLECTIVE: 'Information collective',
  VISITE: 'Visite',
  PRESTATION: 'Prestation',
  AUTRE: 'Autre'
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
}

export interface InfosRendezVousAMettreAJour {
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  jeunes: JeuneDuRendezVous[]
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
}

export namespace RendezVous {
  // FIXME: le linter ne comprend pas cette technique 🤷‍️
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Historique = _Historique.Historique
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import AnimationCollective = _AnimationCollective.AnimationCollective

  export interface Repository {
    save(rendezVous: RendezVous): Promise<void>

    get(id: string): Promise<RendezVous | undefined>

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

  export function estUnTypeAnimationCollective(type?: string): boolean {
    return (
      Boolean(type) &&
      (type === CodeTypeRendezVous.ATELIER ||
        type === CodeTypeRendezVous.INFORMATION_COLLECTIVE)
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
      if (
        RendezVous.estUnTypeAnimationCollective(infosRendezVousACreer.type) &&
        !conseiller!.agence?.id
      ) {
        return failure(new ConseillerSansAgenceError(conseiller.id))
      }

      for (const jeune of jeunes) {
        if (jeune.conseiller?.id !== conseiller.id) {
          return failure(
            new JeuneNonLieAuConseillerError(conseiller.id, jeune.id)
          )
        }
      }

      return success({
        id: this.idService.uuid(),
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
          : undefined
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
              'Une Animation Collective cloturée ne peut plus etre modifiée.'
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
      }

      return success({
        ...rendezVousInitial,
        commentaire: infosRendezVousAMettreAJour.commentaire,
        date: new Date(infosRendezVousAMettreAJour.date),
        duree: infosRendezVousAMettreAJour.duree,
        modalite: infosRendezVousAMettreAJour.modalite,
        jeunes: infosRendezVousAMettreAJour.jeunes,
        adresse: infosRendezVousAMettreAJour.adresse,
        organisme: infosRendezVousAMettreAJour.organisme,
        presenceConseiller: infosRendezVousAMettreAJour.presenceConseiller
      })
    }
  }
}