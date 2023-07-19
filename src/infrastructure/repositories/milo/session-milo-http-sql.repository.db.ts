import { Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { SessionMilo } from 'src/domain/milo/session.milo'
import {
  emptySuccess,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { ConseillerMilo } from '../../../domain/milo/conseiller.milo'
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
  ): Promise<Result> {
    const idsJeunes = inscriptionsATraiter.idsJeunesAInscrire.concat(
      inscriptionsATraiter.desinscriptions.map(({ idJeune }) => idJeune)
    )
    const idsDossier = await mapperIdsDossier(idsJeunes)

    const desinscriptions = inscriptionsATraiter.desinscriptions.map(
      desinscription => ({
        idDossier: idsDossier.get(desinscription.idJeune)!,
        idInstanceSession: desinscription.idInscription
      })
    )
    const resultDesinscriptions =
      await this.miloClient.desinscrireJeunesSession(tokenMilo, desinscriptions)
    if (isFailure(resultDesinscriptions)) return resultDesinscriptions

    const idsDossierNouveauxInscrits =
      inscriptionsATraiter.idsJeunesAInscrire.map(
        idJeune => idsDossier.get(idJeune)!
      )
    const resultInscriptions = await this.miloClient.inscrireJeunesSession(
      tokenMilo,
      session.id,
      idsDossierNouveauxInscrits
    )
    if (isFailure(resultInscriptions)) return resultInscriptions

    const sessionMiloSqlModel: AsSql<SessionMiloDto> = {
      id: session.id,
      estVisible: session.estVisible,
      idStructureMilo: session.idStructureMilo,
      dateModification: session.dateModification.toJSDate()
    }
    await SessionMiloSqlModel.upsert(sessionMiloSqlModel)

    return emptySuccess()
  }
}

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
    case 'ONGOING':
      return SessionMilo.Inscription.Statut.INSCRIT
    case 'REFUSAL':
      return SessionMilo.Inscription.Statut.REFUS_TIERS
    case 'REFUSAL_YOUNG':
      return SessionMilo.Inscription.Statut.REFUS_JEUNE
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
      return { code: type, label: 'Atelier i-milo' }
    case OffreTypeCode.COLLECTIVE_INFORMATION:
      return { code: type, label: 'info coll i-milo' }
    default:
      const logger = new Logger('SessionMilo.dtoToSessionMiloTypeOffre')
      logger.error(
        `Une session a un type d'offre inconnu : offre ${offreDto.id}, type ${type}`
      )
      return { code: type, label: 'Atelier i-milo' }
  }
}

async function mapperIdsDossier(
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
