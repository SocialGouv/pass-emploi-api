import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DateTime } from 'luxon'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { isFailure, Result, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Conseiller } from 'src/domain/conseiller/conseiller'
import { estMilo } from 'src/domain/core'
import { ConseillerMiloRepositoryToken } from 'src/domain/milo/conseiller.milo.db'
import { sessionsMiloSontActiveesPourLeConseiller } from 'src/utils/feature-flip-session-helper'
import {
  InscritSessionMiloDto,
  MILO_INSCRIT,
  MILO_PRESENT,
  SessionConseillerDetailDto
} from '../../../infrastructure/clients/dto/milo.dto'
import { KeycloakClient } from '../../../infrastructure/clients/keycloak-client'
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
    private keycloakClient: KeycloakClient,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private configService: ConfigService
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

    if (
      !sessionsMiloSontActiveesPourLeConseiller(this.configService, conseiller)
    ) {
      return success([])
    }

    const idpToken = await this.keycloakClient.exchangeTokenConseillerMilo(
      query.accessToken
    )

    const { id: idStructureMilo, timezone: timezoneStructure } =
      conseiller.structure
    const resultSessionMiloClient = await this.miloClient.getSessionsConseiller(
      idpToken,
      idStructureMilo,
      timezoneStructure,
      {
        periode: {
          dateDebut: query.dateDebut,
          dateFin: query.dateFin
        }
      }
    )

    if (isFailure(resultSessionMiloClient)) {
      return resultSessionMiloClient
    }

    const sessionsDto = resultSessionMiloClient.data.sessions
    if (!sessionsDto.length) return success([])

    const jeunesByIdPartenaire = await this.mapJeunesConseillerByIdPartenaire(
      conseiller.id
    )

    const resultData: AgendaConseillerMiloSessionListItemQueryModel[] = []
    for (const sessionDto of sessionsDto) {
      const resultInscrits = await this.miloClient.getListeInscritsSession(
        idpToken,
        sessionDto.session.id.toString()
      )
      if (isFailure(resultInscrits)) continue
      const listeInscritsQueryModels =
        this.extractJeunesDuConseillerParticipants(
          resultInscrits.data,
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
      .filter(
        ({ statut }) => statut === MILO_INSCRIT || statut === MILO_PRESENT
      )
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
