import { DateTime } from 'luxon'
import { MaxInscritsDepasse } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
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
      ...session,
      estVisible: visibilite,
      dateModification
    }
  }

  export function extraireInscriptionsATraiter(
    session: SessionMilo,
    inscriptions: Array<
      Pick<SessionMilo.Inscription, 'idJeune' | 'statut' | 'commentaire'>
    >
  ): Result<InscriptionsATraiter> {
    const inscriptionsATraiter = trierInscriptionsATraiter(
      session,
      inscriptions
    )

    // todo ne pas oublier de remettre la logique relatif au nbMaxParticipants
    // todo penser aux inscription  en statut inscrit qui libere des place
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
    commentaire?: string
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

function trierInscriptionsATraiter(
  session: SessionMilo,
  inscriptions: Array<
    Pick<SessionMilo.Inscription, 'idJeune' | 'statut' | 'commentaire'>
  >
): InscriptionsATraiter {
  const inscriptionsExistantes = getInscriptionsExistantes(session)

  const idsJeunesAInscrire = []
  const inscriptionsASupprimer = []
  const inscriptionsAModifier = []

  for (const inscription of inscriptions) {
    switch (inscription.statut) {
      case SessionMilo.Inscription.Statut.INSCRIT:
        if (!inscriptionsExistantes.has(inscription.idJeune))
          idsJeunesAInscrire.push(inscription.idJeune)
        else {
          const inscriptionExistante = inscriptionsExistantes.get(
            inscription.idJeune
          )
          if (
            inscriptionExistante!.statut !==
            SessionMilo.Inscription.Statut.INSCRIT
          )
            inscriptionsAModifier.push({
              ...inscription,
              idInscription: inscriptionExistante!.idInscription
            })
        }
        break

      case SessionMilo.Inscription.Statut.DESINSCRIT:
        if (inscriptionsExistantes.has(inscription.idJeune))
          inscriptionsASupprimer.push({
            idJeune: inscription.idJeune,
            idInscription: inscriptionsExistantes.get(inscription.idJeune)!
              .idInscription
          })
        break

      case SessionMilo.Inscription.Statut.REFUS_JEUNE:
      case SessionMilo.Inscription.Statut.REFUS_TIERS:
        if (
          inscriptionsExistantes.has(inscription.idJeune) &&
          inscriptionsExistantes.get(inscription.idJeune)!.statut !==
            inscription.statut
        )
          inscriptionsAModifier.push({
            ...inscription,
            idInscription: inscriptionsExistantes.get(inscription.idJeune)!
              .idInscription
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
