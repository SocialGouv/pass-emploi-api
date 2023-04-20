import { Injectable } from '@nestjs/common'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import {
  FormulaireImmersionPayload,
  ImmersionClient
} from 'src/infrastructure/clients/immersion-client'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'

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
    private immersionClient: ImmersionClient,
    private evenementService: EvenementService
  ) {
    super('CreateContactImmersionCommandHandler')
  }

  async authorize(
    command: EnvoyerFormulaireContactImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
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

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_IMMERSION_ENVOI_FORMULAIRE,
      utilisateur
    )
  }
}
