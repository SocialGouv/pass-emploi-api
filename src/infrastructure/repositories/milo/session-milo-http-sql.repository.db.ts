import { Injectable, Logger } from '@nestjs/common'
import { DateTime } from 'luxon'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { InscritSessionMiloQueryModel } from '../../../application/queries/query-models/sessions.milo.query.model'
import {
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
    const inscrits = resultInscrits.data
    const sessionDto = resultSession.data

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
    session: SessionMilo & { dateModification: DateTime },
    // FIXME nommage
    inscriptionsModifiees: Array<
      Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>
    >,
    tokenMilo: string
  ): Promise<void> {
    const idsDossierNouveauxInscrits = await getIdsDossierNouveauxInscrits(
      inscriptionsModifiees
    )
    await this.miloClient.inscrireJeunesSession(
      tokenMilo,
      session.id,
      idsDossierNouveauxInscrits
    )

    const sessionMiloSqlModel: AsSql<SessionMiloDto> = {
      id: session.id,
      estVisible: session.estVisible,
      idStructureMilo: session.idStructureMilo,
      dateModification: session.dateModification.toJSDate()
    }
    await SessionMiloSqlModel.upsert(sessionMiloSqlModel)
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
): InscritSessionMiloQueryModel {
  return {
    idJeune: idJeune,
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

async function getIdsDossierNouveauxInscrits(
  inscriptionsModifiees: Array<
    Pick<SessionMilo.Inscription, 'idJeune' | 'statut'>
  >
): Promise<string[]> {
  const jeunesAInscrire = inscriptionsModifiees.filter(
    ({ statut }) => statut === SessionMilo.Inscription.Statut.INSCRIT
  )
  const inscrits = await JeuneSqlModel.findAll({
    where: {
      id: jeunesAInscrire.map(({ idJeune }) => idJeune)
    },
    attributes: ['idPartenaire']
  })
  return inscrits.map(({ idPartenaire }) => idPartenaire!)
}
