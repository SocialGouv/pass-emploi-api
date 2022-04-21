import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { Unauthorized } from '../../domain/erreur'
import { DetailConseillerQueryModel } from './query-models/conseillers.query-models'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Agence, AgenceRepositoryToken } from '../../domain/agence'

export interface ModifierConseillerQuery extends Query {
  idConseiller: string
  champsConseillerAModifier: Partial<DetailConseillerQueryModel>
}

@Injectable()
export class ModifierConseillerQueryHandler extends QueryHandler<
  ModifierConseillerQuery,
  DetailConseillerQueryModel | undefined
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(AgenceRepositoryToken)
    private agencesRepository: Agence.Repository
  ) {
    super('ModifierConseillerQueryHandler')
  }

  async handle(
    query: ModifierConseillerQuery
  ): Promise<DetailConseillerQueryModel | undefined> {
    const conseillerActuel = await this.conseillerRepository.get(
      query.idConseiller
    )
    if (conseillerActuel != null) {
      return await this.modifierConseillerExistant(conseillerActuel, query)
    } else {
      return undefined
    }
  }

  private async modifierConseillerExistant(
    conseillerActuel: Conseiller,
    query: ModifierConseillerQuery
  ): Promise<Conseiller> {
    if (query.champsConseillerAModifier.agence?.id) {
      const agence = await this.agencesRepository.get(
        query.champsConseillerAModifier.agence.id
      )
      if (!agence)
        throw new NotFoundException(
          'Agence ' + query.champsConseillerAModifier.agence.id + ' not found'
        )
    }
    const conseiller = {
      id: conseillerActuel.id,
      firstName: conseillerActuel.firstName,
      lastName: conseillerActuel.lastName,
      structure: conseillerActuel.structure,
      email: conseillerActuel.email,
      dateVerificationMessages: conseillerActuel.dateVerificationMessages,
      agence: query.champsConseillerAModifier.agence ?? conseillerActuel.agence
    }
    await this.conseillerRepository.save(conseiller)
    return conseiller
  }

  async authorize(
    query: ModifierConseillerQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      query.champsConseillerAModifier.id != null ||
      query.champsConseillerAModifier.firstName != null ||
      query.champsConseillerAModifier.lastName != null
    ) {
      throw new Unauthorized("On ne peut modifier que l'agence d'un Conseiller")
    }
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
