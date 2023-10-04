import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Query } from '../../building-blocks/types/query'
import {
  Result,
  emptySuccess,
  failure,
  isFailure
} from '../../building-blocks/types/result'
import { Agence, AgenceRepositoryToken } from '../../domain/agence'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { DateTime } from 'luxon'

export interface ModifierConseillerCommand extends Query {
  idConseiller: string
  agence?: Agence
  dateSignatureCGU?: DateTime
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
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('ModifierConseillerCommandHandler')
  }

  async handle(command: ModifierConseillerCommand): Promise<Result> {
    const conseillerActuel = await this.conseillerRepository.get(
      command.idConseiller
    )
    if (!conseillerActuel) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    if (command.agence?.id) {
      const agence = await this.agencesRepository.get(
        command.agence.id,
        Agence.getStructureDeReference(conseillerActuel.structure)
      )
      if (!agence) {
        return failure(new NonTrouveError('Agence', command.agence.id))
      }
    }

    const infosDeMiseAJour: Conseiller.InfosDeMiseAJour = {
      notificationsSonores:
        command.notificationsSonores ?? conseillerActuel.notificationsSonores,
      agence: command.agence ?? conseillerActuel.agence,
      dateSignatureCGU:
        command.dateSignatureCGU ?? conseillerActuel.dateSignatureCGU
    }

    const conseillerResult = Conseiller.mettreAJour(
      conseillerActuel,
      infosDeMiseAJour
    )

    if (isFailure(conseillerResult)) {
      return conseillerResult
    }
    await this.conseillerRepository.save(conseillerResult.data)
    return emptySuccess()
  }

  async authorize(
    query: ModifierConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      query.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
