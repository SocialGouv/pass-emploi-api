import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Authentification } from 'src/domain/authentification'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { toDetailJeuneConseillerQueryModel } from './query-mappers/jeune.mappers'
import { DetailJeuneConseillerQueryModel } from './query-models/jeunes.query-models'

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
    @Inject(ConseillersRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
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
  ): Promise<void> {
    this.conseillerAuthorizer.authorizeConseiller(utilisateur)

    const conseiller = await this.conseillersRepository.get(query.idConseiller)
    if (!conseiller) {
      throw new NonTrouveError('Conseiller', query.idConseiller)
    }
    if (
      !utilisateurEstSuperviseurDuConseiller(utilisateur, conseiller) &&
      !utilisateurEstConseiller(utilisateur, conseiller)
    ) {
      throw new DroitsInsuffisants()
    }
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
                 jeune.id_authentification,
                 MAX(evenement_engagement.date_evenement) as date_evenement,
                 conseiller.email                         as email_conseiller_precedent,
                 conseiller.prenom                        as prenom_conseiller_precedent,
                 conseiller.nom                           as nom_conseiller_precedent,
                 situations_milo.situation_courante       as situation_courante
          FROM jeune
                   LEFT JOIN evenement_engagement
                             ON evenement_engagement.id_utilisateur = jeune.id AND
                                evenement_engagement.type_utilisateur = '${Authentification.Type.JEUNE}'
                   LEFT JOIN transfert_conseiller
                             ON transfert_conseiller.id = (SELECT transfert_conseiller.id
                                                           FROM transfert_conseiller
                                                           WHERE transfert_conseiller.id_jeune = jeune.id
                                                             AND transfert_conseiller.id_conseiller_cible = jeune.id_conseiller
                                                           ORDER BY transfert_conseiller.date_transfert DESC
                                                           LIMIT 1
                             )
                   LEFT JOIN conseiller ON conseiller.id = transfert_conseiller.id_conseiller_source
                   LEFT JOIN situations_milo ON situations_milo.id_jeune = jeune.id
          WHERE jeune.id_conseiller = :idConseiller
          GROUP BY jeune.id, transfert_conseiller.id, conseiller.id, jeune.prenom, jeune.nom, situations_milo.situation_courante
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
