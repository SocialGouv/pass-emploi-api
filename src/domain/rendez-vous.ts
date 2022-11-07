import { IdService } from '../utils/id-service'
import { Jeune } from './jeune/jeune'
import { Conseiller } from './conseiller'
import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'

export const RendezVousRepositoryToken = 'RendezVous.Repository'
export const AnimationCollectiveRepositoryToken =
  'AnimationCollective.Repository'

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

  export function estUneAnimationCollective(
    rendezVous: RendezVous
  ): rendezVous is AnimationCollective {
    return (
      rendezVous.type === CodeTypeRendezVous.ATELIER ||
      rendezVous.type === CodeTypeRendezVous.INFORMATION_COLLECTIVE
    )
  }

  export function createRendezVousConseiller(
    infosRendezVousACreer: InfosRendezVousACreer,
    jeunes: Jeune[],
    conseiller: Conseiller,
    idService: IdService
  ): RendezVous {
    return {
      id: idService.uuid(),
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
    }
  }

  export function mettreAJour(
    rendezVousInitial: RendezVous,
    infosRendezVousAMettreAJour: InfosRendezVousAMettreAJour
  ): RendezVous {
    return {
      ...rendezVousInitial,
      commentaire: infosRendezVousAMettreAJour.commentaire,
      date: new Date(infosRendezVousAMettreAJour.date),
      duree: infosRendezVousAMettreAJour.duree,
      modalite: infosRendezVousAMettreAJour.modalite,
      jeunes: infosRendezVousAMettreAJour.jeunes,
      adresse: infosRendezVousAMettreAJour.adresse,
      organisme: infosRendezVousAMettreAJour.organisme,
      presenceConseiller: infosRendezVousAMettreAJour.presenceConseiller
    }
  }

  export interface AnimationCollective extends RendezVous {
    type: CodeTypeRendezVous.ATELIER | CodeTypeRendezVous.INFORMATION_COLLECTIVE
  }

  export namespace AnimationCollective {
    export enum Statut {
      A_VENIR = 'A_VENIR',
      A_CLOTURER = 'A_CLOTURER',
      CLOTUREE = 'CLOTUREE'
    }

    export function estCloturee(rendezVous: RendezVous): boolean {
      return Boolean(
        RendezVous.estUnTypeAnimationCollective(rendezVous.type) &&
          rendezVous.dateCloture
      )
    }

    export interface Repository {
      getAllAVenir(idEtablissement: string): Promise<AnimationCollective[]>
      save(animationCollective: AnimationCollective): Promise<void>
    }

    @Injectable()
    export class Service {
      constructor(
        @Inject(AnimationCollectiveRepositoryToken)
        private repository: Repository
      ) {}

      async desinscrire(idsJeunes: string[], idAgence: string): Promise<void> {
        const animationsCollectives = await this.repository.getAllAVenir(
          idAgence
        )

        for (const animationCollective of animationsCollectives) {
          animationCollective.jeunes = animationCollective.jeunes.filter(
            jeune => !idsJeunes.includes(jeune.id)
          )
          await this.repository.save(animationCollective)
        }
      }
    }
  }
}
