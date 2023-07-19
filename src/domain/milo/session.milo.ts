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
    trucsQuiViennentDeLaCommand: Array<
      Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>
    >,
    dateModification: DateTime
  ): Result<{
    sessionModifiee: Required<
      Pick<
        SessionMilo,
        'id' | 'idStructureMilo' | 'estVisible' | 'dateModification'
      >
    >
    inscriptionsATraiter: {
      idsJeunesAInscrire: string[]
      desinscriptions: Array<{ idJeune: string; idInscription: string }>
    }
  }> {
    if (
      session.nbPlacesDisponibles &&
      trucsQuiViennentDeLaCommand.length > session.nbPlacesDisponibles
    ) {
      return failure(new MaxInscritsDepasse())
    }

    const nouvellesInscriptions = trucsQuiViennentDeLaCommand
      .filter(({ statut }) => statut === SessionMilo.Inscription.Statut.INSCRIT)
      .filter(
        inscriptionATraiter =>
          !session.inscriptions.some(
            inscriptionExistante =>
              inscriptionExistante.idJeune === inscriptionATraiter.idJeune
          )
      )
      .map(({ idJeune }) => idJeune)

    const desinscriptions = trucsQuiViennentDeLaCommand
      .filter(
        ({ statut }) => statut === SessionMilo.Inscription.Statut.DESINSCRIT
      )
      .filter(inscriptionATraiter =>
        session.inscriptions.some(
          inscriptionExistante =>
            inscriptionExistante.idJeune === inscriptionATraiter.idJeune
        )
      )
      .map(inscriptionATraiter => ({
        idJeune: inscriptionATraiter.idJeune,
        idInscription: session.inscriptions.find(
          inscriptionExistante =>
            inscriptionExistante.idJeune === inscriptionATraiter.idJeune
        )!.idInscription
      }))

    const inscriptionsATraiter = {
      idsJeunesAInscrire: nouvellesInscriptions,
      desinscriptions
    }

    const sessionModifiee = {
      ...session,
      estVisible: visibilite,
      dateModification
    }
    return success({
      sessionModifiee,
      inscriptionsATraiter
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
      inscriptionsATraiter: {
        idsJeunesAInscrire: string[]
        desinscriptions: Array<{ idJeune: string; idInscription: string }>
      },
      tokenMilo: string
    ): Promise<Result>
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
    idInscription: string
    nom: string
    prenom: string
    statut: SessionMilo.Inscription.Statut
  }

  export namespace Inscription {
    export enum Statut {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS',
      DESINSCRIT = 'DESINSCRIT'
    }
  }
}
