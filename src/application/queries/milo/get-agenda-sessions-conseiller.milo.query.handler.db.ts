import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { estMilo } from 'src/domain/core'
import { Conseiller } from 'src/domain/conseiller'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo.db'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import {
  aEteInscrit,
  InscritSessionMiloDto,
  SessionConseillerDetailDto
} from '../../../infrastructure/clients/dto/milo.dto'
import { MiloClient } from '../../../infrastructure/clients/milo-client'
import { JeuneSqlModel } from '../../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import {
  dtoToStatutInscription,
  mapSessionConseillerDtoToAgendaQueryModel
} from '../query-mappers/milo.mappers'
import {
  AgendaConseillerMiloSessionListItemQueryModel,
  InscritSessionMiloQueryModel
} from '../query-models/sessions.milo.query.model'

export interface GetAgendaSessionsConseillerMiloQuery extends Query {
  idConseiller: string
  accessToken: string
  dateDebut: DateTime
  dateFin: DateTime
}

@Injectable()
export class GetAgendaSessionsConseillerMiloQueryHandler extends QueryHandler<
  GetAgendaSessionsConseillerMiloQuery,
  Result<AgendaConseillerMiloSessionListItemQueryModel[]>
> {
  constructor(
    private miloClient: MiloClient,
    private oidcClient: OidcClient,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetAgendaSessionsConseillerMiloQueryHandler')
  }

  async handle(
    query: GetAgendaSessionsConseillerMiloQuery
  ): Promise<Result<AgendaConseillerMiloSessionListItemQueryModel[]>> {
    const resultConseiller = await this.conseillerMiloRepository.get(
      query.idConseiller
    )
    if (isFailure(resultConseiller)) {
      return resultConseiller
    }
    const conseiller = resultConseiller.data

    const idpToken = await this.oidcClient.exchangeTokenConseillerMilo(
      query.accessToken
    )

    const { id: idStructureMilo, timezone: timezoneStructure } =
      conseiller.structure
    const resultSessions =
      await this.miloClient.getSessionsConseillerParStructure(
        idpToken,
        idStructureMilo,
        timezoneStructure,
        {
          periode: {
            debut: query.dateDebut,
            fin: query.dateFin
          }
        }
      )

    if (isFailure(resultSessions)) {
      return resultSessions
    }

    const sessions = resultSessions.data
    if (!sessions.length) return success([])

    const jeunesByIdPartenaire = await this.mapJeunesConseillerByIdPartenaire(
      conseiller.id
    )

    const resultData: AgendaConseillerMiloSessionListItemQueryModel[] = []
    for (const sessionDto of sessions) {
      const listeInscritsQueryModels =
        this.extractJeunesDuConseillerParticipants(
          sessionDto.session.instances ?? [],
          jeunesByIdPartenaire,
          sessionDto
        )

      if (listeInscritsQueryModels.length) {
        resultData.push(
          mapSessionConseillerDtoToAgendaQueryModel(
            sessionDto,
            timezoneStructure,
            listeInscritsQueryModels
          )
        )
      }
    }
    return success(resultData)
  }

  private async mapJeunesConseillerByIdPartenaire(
    idConseiller: string
  ): Promise<Map<string, JeuneSqlModel>> {
    const jeunesSqlModels = await JeuneSqlModel.findAll({
      where: { idConseiller }
    })
    return jeunesSqlModels.reduce((jeunesByIdPartenaire, sqlModel) => {
      if (sqlModel.idPartenaire)
        jeunesByIdPartenaire.set(sqlModel.idPartenaire, sqlModel)
      return jeunesByIdPartenaire
    }, new Map<string, JeuneSqlModel>())
  }

  private extractJeunesDuConseillerParticipants(
    inscrits: InscritSessionMiloDto[],
    jeunesByIdPartenaire: Map<string, JeuneSqlModel>,
    sessionDto: SessionConseillerDetailDto
  ): InscritSessionMiloQueryModel[] {
    return inscrits
      .filter(({ idDossier }) => jeunesByIdPartenaire.has(idDossier.toString()))
      .filter(aEteInscrit)
      .map(inscrit => {
        const sqlModel = jeunesByIdPartenaire.get(inscrit.idDossier.toString())!
        return {
          idJeune: sqlModel.id,
          nom: sqlModel.nom,
          prenom: sqlModel.prenom,
          statut: dtoToStatutInscription(
            inscrit.statut,
            sessionDto.session.id,
            inscrit.idDossier.toString()
          )
        }
      })
  }

  async authorize(
    query: GetAgendaSessionsConseillerMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur,
      estMilo(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
