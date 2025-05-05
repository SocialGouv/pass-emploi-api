import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../utils/date-service'

class ComptageJeuneListeQueryModel {
  @ApiProperty()
  idJeune: string

  @ApiProperty()
  nbHeuresDeclarees: number
}

export class ComptageJeunesQueryModel {
  @ApiProperty({ type: ComptageJeuneListeQueryModel, isArray: true })
  comptages: ComptageJeuneListeQueryModel[]

  @ApiProperty()
  dateDerniereMiseAJour: string
}

export interface GetComptageJeunesByConseillerQuery extends Query {
  idConseiller: string
  accessToken: string
}

@Injectable()
export class GetComptageJeunesByConseillerQueryHandler extends QueryHandler<
  GetComptageJeunesByConseillerQuery,
  Result<ComptageJeunesQueryModel>
> {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private readonly conseillersRepository: Conseiller.Repository,
    private readonly dateService: DateService
  ) {
    super('GetComptageJeunesByConseillerQueryHandler')
  }

  async handle(
    query: GetComptageJeunesByConseillerQuery
  ): Promise<Result<ComptageJeunesQueryModel>> {
    const idsJeunesDuConseillerSql = await JeuneSqlModel.findAll({
      where: { idConseiller: query.idConseiller },
      attributes: ['id']
    })
    return success({
      comptages: idsJeunesDuConseillerSql.map(idJeuneSql => ({
        idJeune: idJeuneSql.id,
        nbHeuresDeclarees: 1
      })),
      dateDerniereMiseAJour: this.dateService.now().toISO()
    })
  }

  async authorize(
    query: GetComptageJeunesByConseillerQuery,
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
      !utilisateurEstUnSuperviseurDuConseiller(utilisateur, conseiller) &&
      !utilisateurEstLeConseiller(utilisateur, conseiller)
    ) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}

function utilisateurEstUnSuperviseurDuConseiller(
  utilisateur: Authentification.Utilisateur,
  conseiller: Conseiller
): boolean {
  return (
    Authentification.estSuperviseur(utilisateur) &&
    conseiller.structure === utilisateur.structure
  )
}

function utilisateurEstLeConseiller(
  utilisateur: Authentification.Utilisateur,
  conseiller: Conseiller
): boolean {
  return conseiller.id === utilisateur.id
}
