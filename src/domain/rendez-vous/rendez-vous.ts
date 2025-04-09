import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  ConseillerSansAgenceError,
  DateNonAutoriseeError,
  JeuneNonLieALAgenceError,
  JeuneNonLieAuConseillerError,
  MauvaiseCommandeError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Jeune } from '../jeune/jeune'
import { Conseiller } from '../milo/conseiller'
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
  RENDEZ_VOUS_MILO = 'RENDEZ_VOUS_MILO'
}

export const TYPES_ANIMATIONS_COLLECTIVES = [
  CodeTypeRendezVous.INFORMATION_COLLECTIVE,
  CodeTypeRendezVous.ATELIER
]

export enum CategorieRendezVous {
  CEJ_RDV = 'CEJ_RDV',
  CEJ_AC = 'CEJ_AC',
  MILO = 'MILO'
}

export const mapCodeCategorieTypeRendezVous: Record<
  CodeTypeRendezVous,
  CategorieRendezVous
> = {
  ACTIVITE_EXTERIEURES: CategorieRendezVous.CEJ_RDV,
  ATELIER: CategorieRendezVous.CEJ_AC,
  ENTRETIEN_INDIVIDUEL_CONSEILLER: CategorieRendezVous.CEJ_RDV,
  ENTRETIEN_PARTENAIRE: CategorieRendezVous.CEJ_RDV,
  INFORMATION_COLLECTIVE: CategorieRendezVous.CEJ_AC,
  VISITE: CategorieRendezVous.CEJ_RDV,
  PRESTATION: CategorieRendezVous.CEJ_RDV,
  AUTRE: CategorieRendezVous.CEJ_RDV,
  RENDEZ_VOUS_MILO: CategorieRendezVous.MILO
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
  RENDEZ_VOUS_MILO: 'Rendez-vous i-milo'
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
  RENDEZ_VOUS_MILO: 'Rendez-vous'
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

export interface JeuneDuRendezVous
  extends Pick<
    Jeune,
    | 'id'
    | 'firstName'
    | 'lastName'
    | 'conseiller'
    | 'email'
    | 'configuration'
    | 'preferences'
  > {
  present?: boolean
}

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

    getAndIncrementRendezVousIcsSequence(
      idRendezVous: string
    ): Promise<number | undefined>
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
      TYPES_ANIMATIONS_COLLECTIVES.includes(type as CodeTypeRendezVous)
    )
  }

  function verifierAgenceJeunes(
    jeunes: JeuneDuRendezVous[],
    idAgence: string
  ): Result {
    for (const jeune of jeunes) {
      if (jeune.conseiller?.idAgence !== idAgence) {
        return failure(new JeuneNonLieALAgenceError(jeune.id, idAgence))
      }
    }
    return emptySuccess()
  }

  function isDateRendezVousValide(date: string): boolean {
    const dateIlYAUnAn = DateTime.now().minus({ year: 1, day: 1 })
    const dateDansDeuxAns = DateTime.now().plus({ year: 2 })
    const rdvDate = DateTime.fromISO(date)
    return (
      rdvDate &&
      DateService.isGreater(rdvDate, dateIlYAUnAn) &&
      DateService.isGreater(dateDansDeuxAns, rdvDate)
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
      const type = infosRendezVousACreer.type
        ? (infosRendezVousACreer.type as CodeTypeRendezVous)
        : CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
      const categorie = mapCodeCategorieTypeRendezVous[type]
      let idAgence = undefined

      switch (categorie) {
        case CategorieRendezVous.MILO:
          return failure(
            new MauvaiseCommandeError('Le type de rendez-vous est invalide')
          )
        case CategorieRendezVous.CEJ_AC:
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
          idAgence = conseiller.agence?.id
          if (!idAgence) {
            return failure(new ConseillerSansAgenceError(conseiller.id))
          }
          const resultVerificationAgence = verifierAgenceJeunes(
            jeunes,
            idAgence
          )
          if (isFailure(resultVerificationAgence)) {
            return resultVerificationAgence
          }
          break
        case CategorieRendezVous.CEJ_RDV:
          if (infosRendezVousACreer.nombreMaxParticipants) {
            return failure(
              new MauvaiseCommandeError(
                'Le champ nombreMaxParticipants ne concerne que les animations collectives.'
              )
            )
          }
          for (const jeune of jeunes) {
            if (jeune.conseiller?.id !== conseiller.id) {
              return failure(
                new JeuneNonLieAuConseillerError(conseiller.id, jeune.id)
              )
            }
          }
      }

      if (!isDateRendezVousValide(infosRendezVousACreer.date)) {
        return failure(new DateNonAutoriseeError())
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
        type,
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
        idAgence,
        nombreMaxParticipants: infosRendezVousACreer.nombreMaxParticipants
      })
    }

    mettreAJour(
      rendezVousInitial: RendezVous,
      infosRendezVousAMettreAJour: InfosRendezVousAMettreAJour
    ): Result<RendezVous> {
      const categorie = mapCodeCategorieTypeRendezVous[rendezVousInitial.type]

      switch (categorie) {
        case CategorieRendezVous.CEJ_AC:
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
          if (rendezVousInitial.idAgence) {
            const resultVerificationAgence = verifierAgenceJeunes(
              infosRendezVousAMettreAJour.jeunes,
              rendezVousInitial.idAgence
            )
            if (isFailure(resultVerificationAgence)) {
              return resultVerificationAgence
            }
          }
          break
        case CategorieRendezVous.CEJ_RDV:
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
          break
        case CategorieRendezVous.MILO:
          return failure(
            new MauvaiseCommandeError('Le type de rendez-vous est invalide')
          )
      }

      if (!isDateRendezVousValide(infosRendezVousAMettreAJour.date)) {
        return failure(new DateNonAutoriseeError())
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
