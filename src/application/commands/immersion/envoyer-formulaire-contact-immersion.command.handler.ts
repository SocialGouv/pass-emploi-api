import { Injectable } from '@nestjs/common'
import { JeuneAuthorizer } from 'src/application/authorizers/authorize-jeune'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import {
  FormulaireImmersionPayload,
  ImmersionClient
} from 'src/infrastructure/clients/immersion-client'

export interface EnvoyerFormulaireContactImmersionCommand {
  idJeune: string
  codeRome: string
  labelRome: string
  siret: string
  prenom: string
  nom: string
  email: string
  contactMode: string
  message?: string
}

@Injectable()
export class EnvoyerFormulaireContactImmersionCommandHandler extends CommandHandler<
  EnvoyerFormulaireContactImmersionCommand,
  void
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private immersionClient: ImmersionClient
  ) {
    super('CreateContactImmersionCommandHandler')
  }

  async authorize(
    command: EnvoyerFormulaireContactImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorizeJeune(command.idJeune, utilisateur)
  }

  async handle(
    command: EnvoyerFormulaireContactImmersionCommand
  ): Promise<Result> {
    const params: FormulaireImmersionPayload = {
      offer: {
        romeCode: command.codeRome,
        romeLabel: command.labelRome
      },
      siret: command.siret,
      potentialBeneficiaryFirstName: command.prenom,
      potentialBeneficiaryLastName: command.nom,
      potentialBeneficiaryEmail: command.email,
      contactMode: command.contactMode
    }
    if (command.message) {
      params.message = command.message
    }

    return this.immersionClient.postFormulaireImmersion(params)
  }

  async monitor(): Promise<void> {
    return
  }
}
