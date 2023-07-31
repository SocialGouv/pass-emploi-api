import { DateTime } from 'luxon'
import { MaxInscritsDepasse } from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
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

export type InscriptionsATraiter = {
  idsJeunesAInscrire: string[]
  inscriptionsASupprimer: Array<
    Pick<SessionMilo.Inscription, 'idJeune' | 'idInscription'>
  >
  inscriptionsAModifier: Array<Omit<SessionMilo.Inscription, 'nom' | 'prenom'>>
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
      id: session.id,
      idStructureMilo: session.idStructureMilo,
      estVisible: visibilite,
      dateModification
    }
  }

  export function extraireInscriptionsATraiter(
    session: SessionMilo,
    inscriptions: SessionMilo.Modification.Inscription[]
  ): Result<InscriptionsATraiter> {
    const inscriptionsATraiter = trierInscriptionsATraiter(
      session,
      inscriptions
    )

    const resultNbPlaces = verifierNombrePlaces(session, inscriptionsATraiter)
    if (isFailure(resultNbPlaces)) return resultNbPlaces

    return success(inscriptionsATraiter)
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
      inscriptionsATraiter: InscriptionsATraiter,
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
    commentaire?: string
  }

  export namespace Inscription {
    export enum Statut {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS',
      PRESENT = 'PRESENT'
    }

    export function estInscrit(
      statut?: SessionMilo.Inscription.Statut
    ): boolean {
      return (
        statut === SessionMilo.Inscription.Statut.INSCRIT ||
        statut === SessionMilo.Inscription.Statut.PRESENT
      )
    }
  }

  export namespace Modification {
    export type Inscription = Pick<
      SessionMilo.Inscription,
      'idJeune' | 'commentaire'
    > & { statut: StatutInscription }

    export enum StatutInscription {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS',
      DESINSCRIT = 'DESINSCRIT'
    }
  }
}

function trierInscriptionsATraiter(
  session: SessionMilo,
  inscriptions: SessionMilo.Modification.Inscription[]
): InscriptionsATraiter {
  const inscriptionsExistantes = getInscriptionsExistantes(session)

  const idsJeunesAInscrire = []
  const inscriptionsASupprimer = []
  const inscriptionsAModifier = []

  for (const inscription of inscriptions) {
    const inscriptionExistante = inscriptionsExistantes.get(inscription.idJeune)

    switch (inscription.statut) {
      case SessionMilo.Modification.StatutInscription.INSCRIT:
        if (!inscriptionExistante) idsJeunesAInscrire.push(inscription.idJeune)
        else if (
          inscriptionExistante.statut !== SessionMilo.Inscription.Statut.INSCRIT
        )
          inscriptionsAModifier.push({
            ...inscription,
            statut: SessionMilo.Inscription.Statut.INSCRIT,
            idInscription: inscriptionExistante.idInscription
          })
        break

      case SessionMilo.Modification.StatutInscription.DESINSCRIT:
        if (inscriptionExistante)
          inscriptionsASupprimer.push({
            idJeune: inscription.idJeune,
            idInscription: inscriptionExistante.idInscription
          })
        break

      case SessionMilo.Modification.StatutInscription.REFUS_JEUNE:
        if (
          inscriptionExistante &&
          inscriptionExistante.statut !==
            SessionMilo.Inscription.Statut.REFUS_JEUNE
        )
          inscriptionsAModifier.push({
            ...inscription,
            statut: SessionMilo.Inscription.Statut.REFUS_JEUNE,
            idInscription: inscriptionExistante.idInscription
          })
        break

      case SessionMilo.Modification.StatutInscription.REFUS_TIERS:
        if (
          inscriptionExistante &&
          inscriptionExistante.statut !==
            SessionMilo.Inscription.Statut.REFUS_TIERS
        )
          inscriptionsAModifier.push({
            ...inscription,
            statut: SessionMilo.Inscription.Statut.REFUS_TIERS,
            idInscription: inscriptionExistante.idInscription
          })
        break
    }
  }
  return { idsJeunesAInscrire, inscriptionsASupprimer, inscriptionsAModifier }
}

function getInscriptionsExistantes(
  session: SessionMilo
): Map<string, SessionMilo.Inscription> {
  return session.inscriptions.reduce((map, inscriptionExistante) => {
    map.set(inscriptionExistante.idJeune, inscriptionExistante)
    return map
  }, new Map<string, SessionMilo.Inscription>())
}

function verifierNombrePlaces(
  session: SessionMilo,
  {
    idsJeunesAInscrire,
    inscriptionsAModifier,
    inscriptionsASupprimer
  }: InscriptionsATraiter
): Result {
  if (!session.nbPlacesDisponibles) return emptySuccess()

  const inscritsExistants = session.inscriptions.filter(
    ({ statut }) => statut === SessionMilo.Inscription.Statut.INSCRIT
  )
  const aReinscrire = inscriptionsAModifier.filter(
    aModifier => aModifier.statut === SessionMilo.Inscription.Statut.INSCRIT
  )

  const aDesinscrire = inscritsExistants.filter(inscrit =>
    inscriptionsASupprimer.some(({ idJeune }) => idJeune === inscrit.idJeune)
  )
  const aRefuser = inscritsExistants.filter(inscrit =>
    inscriptionsAModifier.some(({ idJeune }) => idJeune === inscrit.idJeune)
  )

  const nbPlacesPrises =
    inscritsExistants.length + idsJeunesAInscrire.length + aReinscrire.length
  const nbPlacesLiberees = aDesinscrire.length + aRefuser.length

  if (session.nbPlacesDisponibles < nbPlacesPrises - nbPlacesLiberees) {
    return failure(new MaxInscritsDepasse())
  }
  return emptySuccess()
}
