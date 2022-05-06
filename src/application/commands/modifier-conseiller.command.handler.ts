import { Inject, Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { Authentification } from '../../domain/authentification'
import { Unauthorized } from '../../domain/erreur'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Agence, AgenceRepositoryToken } from '../../domain/agence'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { NonTrouveError } from '../../building-blocks/types/domain-error'

export interface ModifierConseillerCommand extends Query {
  idConseiller: string
  agence?: Agence
  notificationsSonores?: boolean
}

@Injectable()
export class ModifierConseillerCommandHandler extends CommandHandler<
  ModifierConseillerCommand,
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

  async handle(query: ModifierConseillerCommand): Promise<Result> {
    const conseillerActuel = await this.conseillerRepository.get(
      query.idConseiller
    )
    if (conseillerActuel) {
      return this.modifierConseillerExistant(conseillerActuel, query)
    } else {
      return failure(new NonTrouveError('Conseiller', query.idConseiller))
    }
  }

  private async modifierConseillerExistant(
    conseillerActuel: Conseiller,
    query: ModifierConseillerCommand
  ): Promise<Result> {
    if (query.agence?.id) {
      const agence = await this.agencesRepository.get(
        query.agence.id,
        conseillerActuel.structure
      )
      if (!agence) return failure(new NonTrouveError('Agence', query.agence.id))
    }
    const conseiller = this.conseillerFactory.ajoutAgenceAUnConseiller(
      conseillerActuel,
      query.agence
    )
    await this.conseillerRepository.save(conseiller)
    return emptySuccess()
  }

  async authorize(
    query: ModifierConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.id === query.idConseiller
    ) {
      return
    }
    throw new Unauthorized('Conseiller')
  }

  async monitor(): Promise<void> {
    return
  }
}
