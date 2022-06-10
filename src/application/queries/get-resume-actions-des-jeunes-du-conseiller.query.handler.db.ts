import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { ResumeActionsDuJeuneQueryModel } from './query-models/jeunes.query-model'
import { QueryTypes, Sequelize } from 'sequelize'
import { ResumeActionsJeuneDto } from '../../infrastructure/repositories/jeune-sql.repository.db'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'

export interface GetResumeActionsDesJeunesDuConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetResumeActionsDesJeunesDuConseillerQueryHandlerDb extends QueryHandler<
  GetResumeActionsDesJeunesDuConseillerQuery,
  ResumeActionsDuJeuneQueryModel[]
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('GetResumeActionsDesJeunesDuConseillerQueryHandler')
  }

  async handle(
    query: GetResumeActionsDesJeunesDuConseillerQuery
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    const resumesActionsParJeune =
      await this.sequelize.query<ResumeActionsJeuneDto>(
        `
            SELECT jeune.id                                                                   as id_jeune,
                   jeune.prenom                                                               as prenom_jeune,
                   jeune.nom                                                                  as nom_jeune,
                   COUNT(CASE WHEN statut = 'in_progress' AND id_jeune = jeune.id THEN 1 END) as in_progress_actions_count,
                   COUNT(CASE WHEN statut = 'not_started' AND id_jeune = jeune.id THEN 1 END) as todo_actions_count,
                   COUNT(CASE WHEN statut = 'done' AND id_jeune = jeune.id THEN 1 END)        as done_actions_count
            FROM action
                     RIGHT JOIN jeune ON action.id_jeune = jeune.id
            WHERE id_conseiller = :idConseiller
            GROUP BY jeune.id,jeune.nom
            ORDER BY jeune.nom
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { idConseiller: query.idConseiller }
        }
      )

    return resumesActionsParJeune.map(toResumeActionsDuJeuneQueryModel)
  }
  async authorize(
    query: GetResumeActionsDesJeunesDuConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(query.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}

function toResumeActionsDuJeuneQueryModel(
  resumeActionsJeuneDto: ResumeActionsJeuneDto
): ResumeActionsDuJeuneQueryModel {
  return {
    jeuneId: resumeActionsJeuneDto.id_jeune,
    jeuneFirstName: resumeActionsJeuneDto.prenom_jeune,
    jeuneLastName: resumeActionsJeuneDto.nom_jeune,
    todoActionsCount: parseInt(resumeActionsJeuneDto.todo_actions_count),
    doneActionsCount: parseInt(resumeActionsJeuneDto.done_actions_count),
    inProgressActionsCount: parseInt(
      resumeActionsJeuneDto.in_progress_actions_count
    )
  }
}
