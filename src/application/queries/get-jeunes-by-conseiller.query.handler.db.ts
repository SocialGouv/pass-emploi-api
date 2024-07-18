import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Authentification } from '../../domain/authentification'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { toDetailJeuneConseillerQueryModel } from './query-mappers/jeune.mappers'
import { DetailJeuneConseillerQueryModel } from './query-models/jeunes.query-model'

export interface GetJeunesByConseillerQuery extends Query {
  idConseiller: string
}

@Injectable()
export class GetJeunesByConseillerQueryHandler extends QueryHandler<
  GetJeunesByConseillerQuery,
  Result<DetailJeuneConseillerQueryModel[]>
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    @Inject(ConseillerRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository
  ) {
    super('GetJeunesByConseillerQueryHandler')
  }

  async handle(
    query: GetJeunesByConseillerQuery
  ): Promise<Result<DetailJeuneConseillerQueryModel[]>> {
    const jeunes = await this.getAllQueryModelsByConseiller(query.idConseiller)
    return success(jeunes)
  }

  async authorize(
    query: GetJeunesByConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const conseiller = await this.conseillersRepository.get(query.idConseiller)
    if (!conseiller) {
      return failure(new DroitsInsuffisants())
    }
    if (
      !Authentification.estSuperviseurResponsable(
        utilisateur,
        conseiller.structure
      ) &&
      !utilisateurEstSuperviseurDuConseiller(utilisateur, conseiller) &&
      !utilisateurEstConseiller(utilisateur, conseiller)
    ) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  private async getAllQueryModelsByConseiller(
    idConseiller: string
  ): Promise<DetailJeuneConseillerQueryModel[]> {
    const sqlJeunes = await this.sequelize.query(
      `
          SELECT jeune.id,
                 jeune.prenom,
                 jeune.nom,
                 jeune.email,
                 jeune.date_creation,
                 jeune.date_premiere_connexion,
                 jeune.id_authentification,
                 jeune.id_conseiller_initial,
                 jeune.date_derniere_actualisation_token,
                 jeune.date_fin_cej,
                 jeune.id_structure_milo,
                 conseiller_initial.email                         as email_conseiller_precedent,
                 conseiller_initial.prenom                        as prenom_conseiller_precedent,
                 conseiller_initial.nom                           as nom_conseiller_precedent,
                 situations_milo.situation_courante       as situation_courante
          FROM jeune
                   LEFT JOIN conseiller as conseiller_initial ON conseiller_initial.id = jeune.id_conseiller_initial
                   LEFT JOIN situations_milo ON situations_milo.id_jeune = jeune.id
          WHERE jeune.id_conseiller = :idConseiller
          GROUP BY jeune.id, conseiller_initial.id, conseiller_initial.email, jeune.prenom, jeune.nom, situations_milo.situation_courante
          ORDER BY jeune.prenom ASC, jeune.nom ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { idConseiller }
      }
    )

    return sqlJeunes.map(toDetailJeuneConseillerQueryModel)
  }
}

function utilisateurEstSuperviseurDuConseiller(
  utilisateur: Authentification.Utilisateur,
  conseiller: Conseiller
): boolean {
  return (
    Authentification.estSuperviseur(utilisateur) &&
    conseiller.structure === utilisateur.structure
  )
}

function utilisateurEstConseiller(
  utilisateur: Authentification.Utilisateur,
  conseiller: Conseiller
): boolean {
  return conseiller.id === utilisateur.id
}
