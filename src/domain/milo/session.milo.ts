import { DateTime } from 'luxon'
import { Result } from '../../building-blocks/types/result'
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
    // FIXME problème typage inscription (nom/prenom)
    inscriptions: Array<Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>>,
    dateModification: DateTime
  ): {
    sessionModifiee: SessionMilo & {
      dateModification: DateTime
    }
    nouvellesInscriptions: Array<
      Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>
    >
  } {
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
    return {
      sessionModifiee,
      nouvellesInscriptions
    }
  }

  export interface Repository {
    getForConseiller(
      idSession: string,
      structureConseiller: ConseillerMilo.Structure,
      tokenMilo: string
    ): Promise<Result<SessionMilo>>

    // TODO comment cacher tokenMilo ?
    save(
      session: SessionMilo & { dateModification: DateTime },
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
