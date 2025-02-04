import { Inject } from '@nestjs/common'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import {
  JeuneMiloSansIdDossier,
  NonTraitableError,
  NonTraitableReason
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from 'src/building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from 'src/domain/authentification'
import { Chat, ChatRepositoryToken } from 'src/domain/chat'
import { Core } from 'src/domain/core'
import { JeuneMilo, JeuneMiloRepositoryToken } from 'src/domain/milo/jeune.milo'
import {
  SessionMilo,
  SessionMiloRepositoryToken
} from 'src/domain/milo/session.milo'
import { ChatCryptoService } from 'src/utils/chat-crypto-service'

export type InscrireBeneficiaireSessionMiloCommand = {
  idSession: string
  idBeneficiaire: string
  accessToken: string
}

type BeneficiaireMilo = Omit<JeuneMilo, 'conseiller' | 'idPartenaire'> &
  Required<Pick<JeuneMilo, 'conseiller' | 'idPartenaire'>>
export default class InscrireBeneficiaireSessionMiloCommandHandler extends CommandHandler<
  InscrireBeneficiaireSessionMiloCommand,
  void
> {
  constructor(
    @Inject(JeuneMiloRepositoryToken)
    private readonly beneficiaireMiloRepository: JeuneMilo.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    @Inject(SessionMiloRepositoryToken)
    private readonly sessionMiloRepository: SessionMilo.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    private readonly chatCryptoService: ChatCryptoService
  ) {
    super('InscrireBeneficiaireSessionMiloCommandHandler')
  }

  async handle(
    command: InscrireBeneficiaireSessionMiloCommand
  ): Promise<Result> {
    const resultBeneficiaire = await this.recupererBeneficiaire(
      command.idBeneficiaire
    )
    if (isFailure(resultBeneficiaire)) return resultBeneficiaire
    const beneficiaire = resultBeneficiaire.data

    const resultatInscription = await this.inscrireBeneficiaire(
      beneficiaire,
      command.idSession,
      command.accessToken
    )
    if (isFailure(resultatInscription)) return resultatInscription

    return this.envoyerMessageConseiller(
      beneficiaire.id,
      beneficiaire.conseiller.id
    )
  }

  authorize(): Promise<Result> {
    throw new Error('not implemented')
  }

  monitor(): Promise<void> {
    throw new Error('not implemented')
  }

  private async recupererBeneficiaire(
    idBeneficiaire: string
  ): Promise<Result<BeneficiaireMilo>> {
    const resultBeneficiaire = await this.beneficiaireMiloRepository.get(
      idBeneficiaire
    )
    if (isFailure(resultBeneficiaire)) return resultBeneficiaire
    const beneficiaire = resultBeneficiaire.data

    if (!beneficiaire.conseiller) {
      return failure(
        new NonTraitableError(
          'Beneficiaire',
          beneficiaire.id,
          NonTraitableReason.BENEFICIAIRE_SANS_CONSEILLER
        )
      )
    }
    if (!beneficiaire.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(beneficiaire.id))
    }

    return success({
      ...beneficiaire,
      conseiller: beneficiaire.conseiller,
      idPartenaire: beneficiaire.idPartenaire
    })
  }

  private async inscrireBeneficiaire(
    beneficiaire: BeneficiaireMilo,
    idSession: string,
    accessToken: string
  ): Promise<Result> {
    const resultAccesMilo = await this.recupererAccesMilo(
      accessToken,
      beneficiaire.conseiller.id
    )
    if (isFailure(resultAccesMilo)) return resultAccesMilo

    const { accesMiloBeneficiaire, accesMiloConseiller } = resultAccesMilo.data
    const resultVerification =
      await this.sessionMiloRepository.peutInscrireBeneficiaire(
        idSession,
        accesMiloBeneficiaire
      )
    if (isFailure(resultVerification)) return resultVerification

    return this.sessionMiloRepository.inscrireBeneficiaire(
      idSession,
      beneficiaire.idPartenaire,
      accesMiloConseiller
    )
  }

  private async envoyerMessageConseiller(
    idBeneficiaire: string,
    idConseiller: string
  ): Promise<Result> {
    const conversation =
      await this.chatRepository.recupererConversationIndividuelle(
        idBeneficiaire
      )
    if (!conversation) {
      this.logger.error({ message: 'Aucune conversation trouvée' })
      return emptySuccess()
    }

    const { encryptedText, iv } = this.chatCryptoService.encrypt(
      'Votre bénéficiaire s’est inscrit à l’événement suivant'
    )
    await this.chatRepository.envoyerMessageIndividuel(
      conversation.id,
      {
        message: encryptedText,
        iv,
        idConseiller: idConseiller,
        type: 'AUTO_INSCRIPTION'
      },
      { sentByBeneficiaire: true }
    )

    return emptySuccess()
  }

  private async recupererAccesMilo(
    accessToken: string,
    idConseiller: string
  ): Promise<
    Result<{ accesMiloBeneficiaire: string; accesMiloConseiller: string }>
  > {
    const [accesMiloBeneficiaire, resultAccesMiloConseiller] =
      await Promise.all([
        this.authentificationRepository.recupererAccesPartenaire(
          accessToken,
          Core.Structure.MILO
        ),
        this.authentificationRepository.seFairePasserPourUnConseiller(
          idConseiller,
          accessToken,
          Core.Structure.MILO
        )
      ])
    if (isFailure(resultAccesMiloConseiller)) return resultAccesMiloConseiller

    return success({
      accesMiloBeneficiaire,
      accesMiloConseiller: resultAccesMiloConseiller.data
    })
  }
}
