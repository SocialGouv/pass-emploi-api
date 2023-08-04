import { Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { InscriptionsATraiter, SessionMilo } from 'src/domain/milo/session.milo'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'
import {
  InscritSessionMiloDto,
  OffreDto,
  OffreTypeCode,
  SessionConseillerDetailDto
} from '../../clients/dto/milo.dto'
import { MiloClient } from '../../clients/milo-client'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import {
  SessionMiloDto,
  SessionMiloSqlModel
} from '../../sequelize/models/session-milo.sql-model'
import { AsSql } from '../../sequelize/types'

@Injectable()
export class SessionMiloHttpSqlRepository implements SessionMilo.Repository {
  constructor(private readonly miloClient: MiloClient) {}

  async getForConseiller(
    idSession: string,
    structureConseiller: ConseillerMilo.Structure,
    tokenMilo: string
  ): Promise<Result<SessionMilo>> {
    const [resultSession, resultInscrits] = await Promise.all([
      this.miloClient.getDetailSessionConseiller(tokenMilo, idSession),
      this.miloClient.getListeInscritsSession(tokenMilo, idSession)
    ])
    if (isFailure(resultSession)) {
      return resultSession
    }
    if (isFailure(resultInscrits)) {
      return resultInscrits
    }
    const sessionDto = resultSession.data
    const inscrits = resultInscrits.data

    const [idsJeunes, sessionSqlModel] = await Promise.all([
      JeuneSqlModel.findAll({
        where: {
          idPartenaire: inscrits.map(unInscrit =>
            unInscrit.idDossier.toString()
          )
        },
        attributes: ['id', 'idPartenaire']
      }),
      SessionMiloSqlModel.findByPk(idSession)
    ])

    return success(
      dtoToSessionMilo(
        sessionDto,
        sessionSqlModel ?? undefined,
        structureConseiller,
        inscrits,
        idsJeunes
      )
    )
  }

  async save(
    sessionSansInscription: Omit<SessionMilo, 'inscriptions'>,
    {
      inscriptionsAModifier,
      inscriptionsASupprimer,
      idsJeunesAInscrire
    }: InscriptionsATraiter,
    tokenMilo: string
  ): Promise<Result> {
    const idsJeunes = idsJeunesAInscrire
      .concat(inscriptionsASupprimer.map(({ idJeune }) => idJeune))
      .concat(inscriptionsAModifier.map(({ idJeune }) => idJeune))
    const idsDossier = await recupererIdsDossier(idsJeunes)

    const resultDesinscriptions = await this.desinscrire(
      inscriptionsASupprimer,
      idsDossier,
      tokenMilo
    )
    if (isFailure(resultDesinscriptions)) return resultDesinscriptions

    const modificationsTriees = [...inscriptionsAModifier].sort(
      trierReinscriptionsEnDernier
    )
    const resultModifications = await this.modifierInscriptions(
      modificationsTriees,
      sessionSansInscription.fin,
      idsDossier,
      tokenMilo
    )
    if (isFailure(resultModifications)) return resultModifications

    const resultInscriptions = await this.inscrire(
      sessionSansInscription.id,
      idsJeunesAInscrire,
      idsDossier,
      tokenMilo
    )
    if (isFailure(resultInscriptions)) return resultInscriptions

    const sessionMiloSqlModel: AsSql<SessionMiloDto> = {
      id: sessionSansInscription.id,
      estVisible: sessionSansInscription.estVisible,
      idStructureMilo: sessionSansInscription.idStructureMilo,
      dateModification:
        sessionSansInscription.dateModification?.toJSDate() ?? new Date(),
      dateCloture: sessionSansInscription.dateCloture?.toJSDate() ?? null
    }
    await SessionMiloSqlModel.upsert(sessionMiloSqlModel)

    return emptySuccess()
  }

  private async inscrire(
    idSession: string,
    idsJeunesAInscrire: string[],
    idsDossier: Map<string, string>,
    tokenMilo: string
  ): Promise<Result> {
    const idsDossierNouveauxInscrits = idsJeunesAInscrire.map(
      idJeune => idsDossier.get(idJeune)!
    )
    return this.miloClient.inscrireJeunesSession(
      tokenMilo,
      idSession,
      idsDossierNouveauxInscrits
    )
  }

  private async modifierInscriptions(
    inscriptionsAModifier: Array<
      Omit<SessionMilo.Inscription, 'nom' | 'prenom'>
    >,
    dateFinSession: DateTime,
    idsDossier: Map<string, string>,
    tokenMilo: string
  ): Promise<Result> {
    const modifications = inscriptionsAModifier.map(modification => ({
      idDossier: idsDossier.get(modification.idJeune)!,
      idInstanceSession: modification.idInscription,
      ...inscriptionToStatutWithCommentaireAndDateDto(
        modification,
        dateFinSession
      )
    }))
    return this.miloClient.modifierInscriptionJeunesSession(
      tokenMilo,
      modifications
    )
  }

  private async desinscrire(
    inscriptionsASupprimer: Array<{ idJeune: string; idInscription: string }>,
    idsDossier: Map<string, string>,
    tokenMilo: string
  ): Promise<Result> {
    const desinscriptions = inscriptionsASupprimer.map(desinscription => ({
      idDossier: idsDossier.get(desinscription.idJeune)!,
      idInstanceSession: desinscription.idInscription
    }))
    return this.miloClient.desinscrireJeunesSession(tokenMilo, desinscriptions)
  }
}

const MILO_INSCRIT = 'ONGOING'
const MILO_REFUS_TIERS = 'REFUSAL'
const MILO_REFUS_JEUNE = 'REFUSAL_YOUNG'
const MILO_PRESENT = 'ACHIEVED'

function dtoToSessionMilo(
  { session: sessionDto, offre: offreDto }: SessionConseillerDetailDto,
  sessionSql: SessionMiloSqlModel | undefined,
  structureMilo: ConseillerMilo.Structure,
  listeInscrits: InscritSessionMiloDto[],
  jeunes: Array<Pick<JeuneSqlModel, 'id' | 'idPartenaire'>>
): SessionMilo {
  const session: SessionMilo = {
    id: sessionDto.id.toString(),
    nom: sessionDto.nom,
    debut: DateTime.fromFormat(
      sessionDto.dateHeureDebut,
      'yyyy-MM-dd HH:mm:ss',
      {
        zone: structureMilo.timezone
      }
    ),
    fin: DateTime.fromFormat(sessionDto.dateHeureFin, 'yyyy-MM-dd HH:mm:ss', {
      zone: structureMilo.timezone
    }),
    animateur: sessionDto.animateur,
    lieu: sessionDto.lieu,
    estVisible: false,
    idStructureMilo: structureMilo.id,
    offre: dtoToOffre(offreDto),
    inscriptions: dtoToInscriptions(listeInscrits, jeunes)
  }

  if (sessionDto.dateMaxInscription)
    session.dateMaxInscription = DateTime.fromISO(sessionDto.dateMaxInscription)
  if (sessionSql) {
    session.estVisible = sessionSql.estVisible
    session.dateModification = DateTime.fromJSDate(sessionSql.dateModification)
  }
  if (sessionDto.nbPlacesDisponibles)
    session.nbPlacesDisponibles = sessionDto.nbPlacesDisponibles
  if (sessionDto.commentaire) session.commentaire = sessionDto.commentaire

  return session
}

function dtoToOffre(offreDto: OffreDto): SessionMilo.Offre {
  const offre: SessionMilo.Offre = {
    id: offreDto.id.toString(),
    nom: offreDto.nom,
    theme: offreDto.theme,
    type: dtoToSessionMiloTypeOffre(offreDto)
  }

  if (offreDto.description) offre.description = offreDto.description
  if (offreDto.nomPartenaire) offre.nomPartenaire = offreDto.nomPartenaire

  return offre
}

function dtoToInscriptions(
  listeInscrits: InscritSessionMiloDto[],
  jeunes: Array<Pick<JeuneSqlModel, 'id' | 'idPartenaire'>>
): SessionMilo.Inscription[] {
  const mapIdPartenaireToIdJeune: Map<string, string> = jeunes.reduce(
    (resultat, jeune) => {
      resultat.set(jeune.idPartenaire!, jeune.id)
      return resultat
    },
    new Map<string, string>()
  )

  return listeInscrits
    .filter(inscription =>
      mapIdPartenaireToIdJeune.has(inscription.idDossier.toString())
    )
    .map(inscription =>
      dtoToInscription(
        inscription,
        mapIdPartenaireToIdJeune.get(inscription.idDossier.toString())!
      )
    )
}

function dtoToInscription(
  inscritSessionMilo: InscritSessionMiloDto,
  idJeune: string
): SessionMilo.Inscription {
  return {
    idJeune: idJeune,
    idInscription: inscritSessionMilo.idInstanceSession.toString(),
    nom: inscritSessionMilo.nom,
    prenom: inscritSessionMilo.prenom,
    statut: dtoToStatutInscription(inscritSessionMilo)
  }
}

function dtoToStatutInscription(
  inscription: InscritSessionMiloDto
): SessionMilo.Inscription.Statut {
  switch (inscription.statut) {
    case MILO_INSCRIT:
      return SessionMilo.Inscription.Statut.INSCRIT
    case MILO_REFUS_TIERS:
      return SessionMilo.Inscription.Statut.REFUS_TIERS
    case MILO_REFUS_JEUNE:
      return SessionMilo.Inscription.Statut.REFUS_JEUNE
    case MILO_PRESENT:
      return SessionMilo.Inscription.Statut.PRESENT
    default:
      const logger = new Logger('SessionMilo.dtoToStatutInscription')
      logger.error(
        `Une inscription a un statut inconnu : session ${inscription.idInstanceSession}, dossier ${inscription.idDossier}`
      )
      return SessionMilo.Inscription.Statut.INSCRIT
  }
}

function dtoToSessionMiloTypeOffre(offreDto: OffreDto): {
  code: string
  label: string
} {
  const type = offreDto.type
  switch (type) {
    case OffreTypeCode.WORKSHOP:
      return { code: type, label: 'Atelier' }
    case OffreTypeCode.COLLECTIVE_INFORMATION:
      return { code: type, label: 'Information collective' }
    default:
      const logger = new Logger('SessionMilo.dtoToSessionMiloTypeOffre')
      logger.error(
        `Une session a un type d'offre inconnu : offre ${offreDto.id}, type ${type}`
      )
      return { code: type, label: 'Atelier' }
  }
}

async function recupererIdsDossier(
  idsJeunes: string[]
): Promise<Map<string, string>> {
  const jeunes = await JeuneSqlModel.findAll({
    where: {
      id: idsJeunes
    },
    attributes: ['id', 'idPartenaire']
  })
  return jeunes.reduce((map, jeuneSql) => {
    map.set(jeuneSql.id, jeuneSql.idPartenaire!)
    return map
  }, new Map<string, string>())
}

function inscriptionToStatutWithCommentaireAndDateDto(
  inscription: Pick<SessionMilo.Inscription, 'statut' | 'commentaire'>,
  dateFinSession: DateTime
): { statut: string; commentaire?: string; dateFinReelle?: string } {
  switch (inscription.statut) {
    case SessionMilo.Inscription.Statut.INSCRIT:
      return { statut: MILO_INSCRIT }
    case SessionMilo.Inscription.Statut.REFUS_TIERS:
      return { statut: MILO_REFUS_TIERS }
    case SessionMilo.Inscription.Statut.REFUS_JEUNE:
      return { statut: MILO_REFUS_JEUNE, commentaire: inscription.commentaire }
    case SessionMilo.Inscription.Statut.PRESENT:
      return { statut: MILO_PRESENT, dateFinReelle: dateFinSession.toISODate() }
    default:
      throw new Error('Ça devrait pas arriver')
  }
}

function trierReinscriptionsEnDernier({
  statut
}: {
  statut: SessionMilo.Inscription.Statut
}): number {
  return statut === SessionMilo.Inscription.Statut.INSCRIT ? 1 : -1
}
