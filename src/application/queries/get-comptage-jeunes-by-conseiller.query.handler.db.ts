import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  failure,
  isFailure,
  isSuccess,
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
import { Jeune } from '../../domain/jeune/jeune'
import { Op } from 'sequelize'
import { GetComptageJeuneQueryGetter } from './query-getters/get-comptage-jeune.query.getter'

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
    private readonly dateService: DateService,
    private getComptageJeuneQueryGetter: GetComptageJeuneQueryGetter
  ) {
    super('GetComptageJeunesByConseillerQueryHandler')
  }

  async handle(
    query: GetComptageJeunesByConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<ComptageJeunesQueryModel>> {
    const jeunesDuConseillerSql = await JeuneSqlModel.findAll({
      where: {
        idConseiller: query.idConseiller,
        idPartenaire: {
          [Op.ne]: null
        },
        dispositif: Jeune.Dispositif.CEJ
      },
      attributes: ['id', 'idPartenaire']
    })

    const comptages: ComptageJeuneListeQueryModel[] = []

    for (const jeuneSql of jeunesDuConseillerSql) {
      const resultComptage = await this.getComptageJeuneQueryGetter.handle({
        idJeune: jeuneSql.id,
        idDossier: jeuneSql.idPartenaire!,
        accessTokenJeune: undefined,
        accessTokenConseiller: Authentification.estConseiller(utilisateur.type)
          ? query.accessToken
          : undefined,
        dateDebut: this.dateService.now().startOf('week'),
        dateFin: this.dateService.now().endOf('week')
      })

      if (isSuccess(resultComptage))
        comptages.push({
          idJeune: jeuneSql.id,
          nbHeuresDeclarees: resultComptage.data.nbHeuresDeclarees
        })
    }

    return success({
      comptages,
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
