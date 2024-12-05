import { Injectable } from '@nestjs/common'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetBeneficiairesAArchiverQueryGetter } from 'src/application/queries/query-getters/get-beneficiaires-a-archiver.query.getter.db'
import { IdentiteJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-model'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'

type GetBeneficiairesAArchiverQuery = {
  idConseiller: string
}

@Injectable()
export class GetBeneficiairesAArchiverQueryHandler extends QueryHandler<
  GetBeneficiairesAArchiverQuery,
  Result<IdentiteJeuneQueryModel[]>
> {
  constructor(
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    private readonly queryGetter: GetBeneficiairesAArchiverQueryGetter
  ) {
    super('GetBeneficiairesAArchiverQueryHandler')
  }

  async authorize(
    query: GetBeneficiairesAArchiverQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async handle(
    query: GetBeneficiairesAArchiverQuery
  ): Promise<Result<IdentiteJeuneQueryModel[]>> {
    return this.queryGetter.handle(query.idConseiller)
  }

  async monitor(): Promise<void> {
    return
  }
}
