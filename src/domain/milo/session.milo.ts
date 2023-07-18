import { DateTime } from 'luxon'
import { MaxInscritsDepasse } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { ConseillerMilo } from './conseiller.milo'

export const SessionMiloRepositoryToken = 'SessionMilo.Repository'

export interface SessionMilo {
  id: string
  nom: string
  debut: DateTime
  fin: DateTime
  animateur: string
  lieu: string
  estVisible: boolean
  idStructureMilo: string
  offre: SessionMilo.Offre
  inscriptions: SessionMilo.Inscription[]
  dateMaxInscription?: DateTime
  nbPlacesDisponibles?: number
  commentaire?: string
  dateModification?: DateTime
}

export namespace SessionMilo {
  export function modifier(
    session: SessionMilo,
    visibilite: boolean,
    inscriptions: Array<Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>>,
    dateModification: DateTime
  ): Result<{
    sessionModifiee: Required<
      Pick<
        SessionMilo,
        'id' | 'idStructureMilo' | 'estVisible' | 'dateModification'
      >
    >
    nouvellesInscriptions: Array<
      Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>
    >
  }> {
    if (
      session.nbPlacesDisponibles &&
      inscriptions.length > session.nbPlacesDisponibles
    ) {
      return failure(new MaxInscritsDepasse())
    }

    const nouvellesInscriptions = inscriptions
      .filter(({ statut }) => statut === SessionMilo.Inscription.Statut.INSCRIT)
      .filter(
        inscriptionATraiter =>
          !session.inscriptions.some(
            inscriptionExistante =>
              inscriptionExistante.idJeune === inscriptionATraiter.idJeune
          )
      )

    const sessionModifiee = {
      ...session,
      estVisible: visibilite,
      dateModification
    }
    return success({
      sessionModifiee,
      nouvellesInscriptions
    })
  }

  export interface Repository {
    getForConseiller(
      idSession: string,
      structureConseiller: ConseillerMilo.Structure,
      tokenMilo: string
    ): Promise<Result<SessionMilo>>

    save(
      session: Required<
        Pick<
          SessionMilo,
          'id' | 'idStructureMilo' | 'estVisible' | 'dateModification'
        >
      >,
      inscriptionsModifiees: Array<
        Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>
      >,
      tokenMilo: string
    ): Promise<void>
  }

  export type Offre = {
    id: string
    nom: string
    theme: string
    type: { code: string; label: string }
    description?: string
    nomPartenaire?: string
  }

  export type Inscription = {
    idJeune: string
    nom: string
    prenom: string
    statut: SessionMilo.Inscription.Statut
  }

  export namespace Inscription {
    export enum Statut {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS'
    }
  }
}
