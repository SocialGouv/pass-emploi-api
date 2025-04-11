import { DateTime } from 'luxon'
import {
  BeneficiaireDejaInscritError,
  EmargementIncorrect,
  NombrePlacesInsuffisantError
} from 'src/building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure,
  isFailure,
  success
} from 'src/building-blocks/types/result'

export const SessionMiloRepositoryToken = 'SessionMilo.Repository'

export interface SessionMilo {
  id: string
  nom: string
  debut: DateTime
  fin: DateTime
  animateur: string
  lieu: string
  estVisible: boolean
  autoinscription: boolean
  idStructureMilo: string
  offre: SessionMilo.Offre
  inscriptions: SessionMilo.Inscription[]
  dateMaxInscription?: DateTime
  nbPlacesDisponibles?: number
  commentaire?: string
  dateModification?: DateTime
  dateCloture?: DateTime
}

export type SessionMiloAllegeeForBeneficiaire = Pick<
  SessionMilo,
  'id' | 'nom' | 'debut' | 'nbPlacesDisponibles'
> & {
  statutInscription?: SessionMilo.Inscription.Statut
}

export interface InstanceSessionMilo {
  id: string
  idSession: string
  dateHeureDebut: string
  idDossier: string
  statut: string
}

export type InscriptionsATraiter = {
  idsJeunesAInscrire: string[]
  inscriptionsASupprimer: Array<
    Pick<SessionMilo.Inscription, 'idJeune' | 'idInscription'>
  >
  inscriptionsAModifier: Array<Omit<SessionMilo.Inscription, 'nom' | 'prenom'>>
}

export namespace SessionMilo {
  export enum StatutInstance {
    REALISE = 'Réalisé',
    PRESCRIT = 'Prescrit',
    REFUS_TIERS = 'Refus tiers',
    REFUS_JEUNE = 'Refus jeune'
  }

  function supprimerInscriptions(
    session: SessionMilo
  ): Omit<SessionMilo, 'inscriptions'> {
    const { inscriptions: _inscriptions, ...sessionSansInscriptions } = session
    return sessionSansInscriptions
  }

  export function modifier(
    session: SessionMilo,
    dateModification: DateTime,
    nouvelleVisibilite?: boolean,
    nouvelleAutoinscription?: boolean
  ): Omit<SessionMilo, 'inscriptions'> {
    const autoinscription = nouvelleAutoinscription ?? session.autoinscription

    return {
      ...supprimerInscriptions(session),
      estVisible: (autoinscription || nouvelleVisibilite) ?? session.estVisible,
      autoinscription,
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

  export function emarger(
    session: SessionMilo,
    emargements: SessionMilo.Modification.Emargement[],
    dateEmargement: DateTime
  ): Result<{
    sessionEmargee: Omit<SessionMilo, 'inscriptions'>
    inscriptionsAModifier: Array<
      Omit<SessionMilo.Inscription, 'nom' | 'prenom'>
    >
  }> {
    const idsJeuneInscrit = session.inscriptions
      .map(inscription => inscription.idJeune)
      .sort()
    const idsJeuneEmarge = emargements
      .map(emargement => emargement.idJeune)
      .sort()

    if (JSON.stringify(idsJeuneInscrit) !== JSON.stringify(idsJeuneEmarge)) {
      return failure(new EmargementIncorrect())
    }

    const sessionModifiee = {
      ...session,
      dateModification: dateEmargement,
      dateCloture: dateEmargement
    }

    const inscriptionsAModifier = []
    const inscriptionsExistantes = getInscriptionsExistantes(session)

    for (const emargement of emargements) {
      if (!SessionMilo.Inscription.estOuSeraPresent(emargement.statut)) continue

      const inscription = inscriptionsExistantes.get(emargement.idJeune)!

      if (
        emargement.statut === Inscription.Statut.PRESENT &&
        inscription.statut === Inscription.Statut.PRESENT
      )
        continue

      const statutInscription =
        emargement.statut === Inscription.Statut.INSCRIT
          ? SessionMilo.Inscription.Statut.REFUS_JEUNE
          : SessionMilo.Inscription.Statut.PRESENT

      inscriptionsAModifier.push({
        idJeune: inscription.idJeune,
        idInscription: inscription.idInscription,
        statut: statutInscription,
        commentaire:
          statutInscription === SessionMilo.Inscription.Statut.REFUS_JEUNE
            ? 'Absent'
            : undefined
      })
    }

    return success({ sessionEmargee: sessionModifiee, inscriptionsAModifier })
  }

  export function calculerStatut(
    participants: Inscription.Statut[],
    maintenant: DateTime,
    dateFin: DateTime,
    dateCloture?: DateTime
  ): Statut {
    if (dateCloture) return Statut.CLOTUREE
    if (dateFin > maintenant) return Statut.A_VENIR

    const participantsNonEmarges = participants.filter(
      statut => statut === Inscription.Statut.INSCRIT
    )
    return participantsNonEmarges.length > 0
      ? Statut.A_CLOTURER
      : Statut.EMARGEE
  }

  export function peutInscrireBeneficiaire(
    session: SessionMiloAllegeeForBeneficiaire
  ): Result {
    if (Inscription.estOuSeraPresent(session.statutInscription))
      return failure(new BeneficiaireDejaInscritError())

    if (session.nbPlacesDisponibles === 0)
      return failure(new NombrePlacesInsuffisantError())

    return emptySuccess()
  }

  export function estEmargeeMaisPasClose(statut: Statut): boolean {
    return statut === Statut.EMARGEE
  }

  export interface Repository {
    findInstanceSession(
      idInstance: string,
      idDossier: string
    ): Promise<InstanceSessionMilo | undefined>

    getForBeneficiaire(
      idSession: string,
      idDossier: string,
      tokenMiloBeneficiaire: string,
      timezone: string
    ): Promise<Result<SessionMiloAllegeeForBeneficiaire>>

    getForConseiller(
      idSession: string,
      structureConseiller: StructureMilo,
      tokenMiloConseiller: string
    ): Promise<Result<SessionMilo>>

    save(
      sessionSansInscriptions: Omit<SessionMilo, 'inscriptions'>,
      inscriptionsATraiter: InscriptionsATraiter,
      tokenMilo: string
    ): Promise<Result>

    inscrireBeneficiaire(
      session: { id: string; dateDebut: DateTime },
      idDossier: string,
      tokenMiloConseiller: string
    ): Promise<Result>
  }

  export enum Statut {
    A_VENIR = 'A_VENIR',
    A_CLOTURER = 'A_CLOTURER',
    EMARGEE = 'EMARGEE',
    CLOTUREE = 'CLOTUREE'
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
    statut: Inscription.Statut
    commentaire?: string
  }

  export namespace Inscription {
    export enum Statut {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS',
      PRESENT = 'PRESENT'
    }

    export function estIncrit(statut?: Statut): boolean {
      switch (statut) {
        case Inscription.Statut.INSCRIT:
        case Inscription.Statut.REFUS_JEUNE:
        case Inscription.Statut.PRESENT:
          return true
        default:
          return false
      }
    }

    export function estOuSeraPresent(statut?: Statut): boolean {
      switch (statut) {
        case Statut.INSCRIT:
        case Statut.PRESENT:
          return true
        default:
          return false
      }
    }
  }

  export namespace Modification {
    export type Inscription = Pick<
      SessionMilo.Inscription,
      'idJeune' | 'commentaire'
    > & { statut: StatutInscription }

    export type Emargement = Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>

    export enum StatutInscription {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS',
      DESINSCRIT = 'DESINSCRIT'
    }
  }

  export type StructureMilo = { id: string; timezone: string }
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
  if (session.nbPlacesDisponibles === undefined) return emptySuccess()

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

  const nbPlacesPrises = idsJeunesAInscrire.length + aReinscrire.length
  const nbPlacesLiberees = aDesinscrire.length + aRefuser.length

  if (session.nbPlacesDisponibles < nbPlacesPrises - nbPlacesLiberees) {
    return failure(new NombrePlacesInsuffisantError())
  }
  return emptySuccess()
}
