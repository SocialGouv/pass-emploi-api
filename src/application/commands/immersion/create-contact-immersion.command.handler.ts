import { Injectable } from '@nestjs/common'
import { JeuneAuthorizer } from 'src/application/authorizers/authorize-jeune'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { failure, Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { ImmersionClient } from 'src/infrastructure/clients/immersion-client'
import { CreateContactImmersionCommand } from 'src/infrastructure/routes/immersion.controller'

@Injectable()
export class CreateContactImmersionCommandHandler extends CommandHandler<
  CreateContactImmersionCommand,
  void
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private immersionClient: ImmersionClient
  ) {
    super('CreateContactImmersionCommandHandler')
  }

  async authorize(
    command: CreateContactImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorizeJeune(command.idJeune!, utilisateur)
  }

  async handle(command: CreateContactImmersionCommand): Promise<any> {
    let params: CreateContactImmersionCommand = {
      offer: command.offer,
      siret: command.siret,
      potentialBeneficiaryFirstName: command.potentialBeneficiaryFirstName,
      potentialBeneficiaryLastName: command.potentialBeneficiaryLastName,
      potentialBeneficiaryEmail: command.potentialBeneficiaryEmail,
      contactMode: command.contactMode
    }
    if (command.message) {
      params = { ...params, message: command.message }
    }
    try {
      const result = await this.immersionClient.post(
        'v1/contact-establishment',
        params
      )
      return result
    } catch (error) {
      return failure(error)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
