import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { Authentification } from '../../domain/authentification'
import { Unauthorized } from '../../domain/erreur'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Agence, AgenceRepositoryToken } from '../../domain/agence'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { ErreurHttp } from '../../building-blocks/types/domain-error'

export interface ModifierConseillerQuery extends Query {
  idConseiller: string
  champsConseillerAModifier: Partial<DetailConseillerQueryModel>
}

@Injectable()
export class ModifierConseillerCommandHandler extends CommandHandler<
  ModifierConseillerQuery,
  void
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(AgenceRepositoryToken)
    private agencesRepository: Agence.Repository,
    private conseillerFactory: Conseiller.Factory
  ) {
    super('ModifierConseillerQueryHandler')
  }

  async handle(query: ModifierConseillerQuery): Promise<Result> {
    const conseillerActuel = await this.conseillerRepository.get(
      query.idConseiller
    )
    if (conseillerActuel != null) {
      return this.modifierConseillerExistant(conseillerActuel, query)
    } else {
      return failure(
        new ErreurHttp(
          'le conseiller ' + query.idConseiller + " n'éxiste pas",
          404
        )
      )
    }
  }

  private async modifierConseillerExistant(
    conseillerActuel: Conseiller,
    query: ModifierConseillerQuery
  ): Promise<Result> {
    if (query.champsConseillerAModifier.agence?.id) {
      const agence = await this.agencesRepository.get(
        query.champsConseillerAModifier.agence.id
      )
      if (!agence)
        return failure(
          new ErreurHttp(
            "l'agence " +
              query.champsConseillerAModifier.agence.id +
              " n'éxiste pas",
            404
          )
        )
    }
    const conseiller = this.conseillerFactory.ajoutAgenceAUnConseiller(
      conseillerActuel,
      query.champsConseillerAModifier.agence
    )
    await this.conseillerRepository.save(conseiller)
    return emptySuccess()
  }

  async authorize(
    query: ModifierConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      query.champsConseillerAModifier.id != undefined ||
      query.champsConseillerAModifier.firstName != undefined ||
      query.champsConseillerAModifier.lastName != undefined
    ) {
      throw new Unauthorized("On ne peut modifier que l'agence d'un Conseiller")
    }
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.id === query.idConseiller
    ) {
      const id = query.champsConseillerAModifier.agence?.id
      if (
        id &&
        (await this.agencesRepository.getStructureOfAgence(id)) !=
          utilisateur.structure
      ) {
        throw new Unauthorized(
          "Le conseiller et l'agence n'appartiennent pas à la même structure"
        )
      }
      return
    }
    throw new Unauthorized('Conseiller')
  }

  async monitor(): Promise<void> {
    return
  }
}
