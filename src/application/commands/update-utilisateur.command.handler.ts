import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import {
  Result, success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { UtilisateurQueryModel } from '../queries/query-models/authentification.query-models'

export interface UpdateUtilisateurCommand extends Command {
  idUtilisateurAuth: string
  nom?: string
  prenom?: string
  email?: string
  type: Authentification.Type
  structure: Authentification.Structure
  federatedToken?: string
}

@Injectable()
export class UpdateUtilisateurCommandHandler {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillerRepository: Conseiller.Repository
  ) {}

  async execute(_command: UpdateUtilisateurCommand): Promise<Result<UtilisateurQueryModel>> {
    // @ts-ignore
    return success(utilisateurQueryModel)
  }
}
