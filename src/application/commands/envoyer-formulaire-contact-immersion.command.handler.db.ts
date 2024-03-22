import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { Result, failure, isFailure } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Evenement, EvenementService } from 'src/domain/evenement'
import {
  FormulaireImmersionPayload,
  ImmersionClient
} from 'src/infrastructure/clients/immersion-client'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { PartenaireImmersion } from '../../infrastructure/repositories/dto/immersion.dto'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

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
    private evenementService: EvenementService,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('CreateContactImmersionCommandHandler')
  }

  async authorize(
    command: EnvoyerFormulaireContactImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
  }

  async handle(
    command: EnvoyerFormulaireContactImmersionCommand
  ): Promise<Result> {
    const defaultMessage =
      'Bonjour, Je souhaiterais passer quelques jours dans votre entreprise en immersion professionnelle auprès de vos salariés pour découvrir ce métier. Pourriez-vous me proposer un rendez-vous ? Je pourrais alors vous expliquer directement mon projet.'

    const appellationCode = await this.getAppellationCodeFromLabel(
      command.labelRome
    )

    if (!appellationCode) {
      return failure(new NonTrouveError('Offre Immersion', command.labelRome))
    }

    const offre = await this.immersionClient.getDetailOffre(
      `${command.siret}/${appellationCode}`
    )
    if (isFailure(offre)) {
      return failure(new NonTrouveError('Offre Immersion', command.labelRome))
    }

    const params: FormulaireImmersionPayload = {
      appellationCode: appellationCode,
      siret: command.siret,
      potentialBeneficiaryFirstName: command.prenom,
      potentialBeneficiaryLastName: command.nom,
      potentialBeneficiaryEmail: command.email,
      potentialBeneficiaryPhone: '0600000000',
      immersionObjective: "Découvrir un métier ou un secteur d'activité",
      contactMode: PartenaireImmersion.ContactMode.EMAIL,
      message: command.message ?? defaultMessage,
      locationId: offre.data.locationId
    }

    return this.immersionClient.envoyerFormulaireImmersion(params)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_IMMERSION_ENVOI_FORMULAIRE,
      utilisateur
    )
  }

  async getAppellationCodeFromLabel(label: string): Promise<string> {
    const metiers: Array<{ appellation_code: string }> =
      await this.sequelize.query(
        `SELECT appellation_code
       FROM "referentiel_metier_rome"
       WHERE libelle = ?`,
        {
          replacements: [label],
          type: QueryTypes.SELECT
        }
      )

    const appellationCode: string = metiers.map(m => m.appellation_code)[0]

    return appellationCode
  }
}
