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
    dateModification: DateTime
  ): Required<
    Pick<
      SessionMilo,
      'id' | 'idStructureMilo' | 'estVisible' | 'dateModification'
    >
  > {
    return {
      ...session,
      estVisible: visibilite,
      dateModification
    }
  }

  export function extraireInscriptionsATraiter(
    session: SessionMilo,
    inscriptions: Array<Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>>
  ): Result<{
    idsJeunesAInscrire: string[]
    inscriptionsASupprimer: Array<{ idJeune: string; idInscription: string }>
  }> {
    if (
      session.nbPlacesDisponibles &&
      inscriptions.length > session.nbPlacesDisponibles
    ) {
      return failure(new MaxInscritsDepasse())
    }

    const idsJeunesAInscrire = extraireIdsJeunesAInscrire(session, inscriptions)
    const inscriptionsASupprimer = extraireInscriptionsASupprimer(
      session,
      inscriptions
    )

    return success({
      idsJeunesAInscrire,
      inscriptionsASupprimer
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
        inscriptionsASupprimer: Array<{
          idJeune: string
          idInscription: string
        }>
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

function extraireIdsJeunesAInscrire(
  session: SessionMilo,
  inscriptions: Array<Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>>
): string[] {
  return inscriptions
    .filter(({ statut }) => statut === SessionMilo.Inscription.Statut.INSCRIT)
    .filter(
      inscriptionATraiter =>
        !session.inscriptions.some(
          inscriptionExistante =>
            inscriptionExistante.idJeune === inscriptionATraiter.idJeune
        )
    )
    .map(({ idJeune }) => idJeune)
}

function extraireInscriptionsASupprimer(
  session: SessionMilo,
  inscriptions: Array<Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>>
): Array<{
  idInscription: string
  idJeune: string
}> {
  return inscriptions
    .filter(
      ({ statut }) => statut === SessionMilo.Inscription.Statut.DESINSCRIT
    )
    .filter(desinscriptionATraiter =>
      session.inscriptions.some(
        inscriptionExistante =>
          inscriptionExistante.idJeune === desinscriptionATraiter.idJeune
      )
    )
    .map(desinscriptionATraiter => ({
      idJeune: desinscriptionATraiter.idJeune,
      idInscription: session.inscriptions.find(
        inscriptionExistante =>
          inscriptionExistante.idJeune === desinscriptionATraiter.idJeune
      )!.idInscription
    }))
}
