import { Inject } from '@nestjs/common'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  JeuneMiloSansIdDossier,
  NonTraitableError,
  NonTraitableReason,
  NonTrouveError
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
import { Evenement, EvenementService } from 'src/domain/evenement'
import { JeuneMilo, JeuneMiloRepositoryToken } from 'src/domain/milo/jeune.milo'
import {
  SessionMilo,
  SessionMiloAllegeeForBeneficiaire,
  SessionMiloRepositoryToken
} from 'src/domain/milo/session.milo'
import { Notification } from 'src/domain/notification/notification'
import { ChatCryptoService } from 'src/utils/chat-crypto-service'

export type AutoinscrireBeneficiaireSessionMiloCommand = {
  idSession: string
  idBeneficiaire: string
  accessToken: string
}

type ChampsObligatoire = 'conseiller' | 'idPartenaire'
type BeneficiaireMilo = Omit<JeuneMilo, ChampsObligatoire> &
  Required<Pick<JeuneMilo, ChampsObligatoire>>

export default class AutoinscrireBeneficiaireSessionMiloCommandHandler extends CommandHandler<
  AutoinscrireBeneficiaireSessionMiloCommand,
  void,
  JeuneMilo
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
    private readonly chatCryptoService: ChatCryptoService,
    private readonly notificationService: Notification.Service,
    private readonly evenementService: EvenementService
  ) {
    super('InscrireBeneficiaireSessionMiloCommandHandler')
  }

  async getAggregate(
    command: AutoinscrireBeneficiaireSessionMiloCommand
  ): Promise<JeuneMilo | undefined> {
    const resultBeneficiaire = await this.beneficiaireMiloRepository.get(
      command.idBeneficiaire
    )
    if (isFailure(resultBeneficiaire)) return undefined
    return resultBeneficiaire.data
  }

  async handle(
    command: AutoinscrireBeneficiaireSessionMiloCommand,
    _utilisateur: Authentification.Utilisateur,
    aggregate?: JeuneMilo
  ): Promise<Result> {
    const resultBeneficiaire = await this.recupererBeneficiaire(
      command.idBeneficiaire,
      aggregate
    )
    if (isFailure(resultBeneficiaire)) return resultBeneficiaire
    const beneficiaire = resultBeneficiaire.data

    const resultatInscription = await this.inscrireBeneficiaire(
      beneficiaire,
      command.idSession,
      command.accessToken
    )
    if (isFailure(resultatInscription)) return resultatInscription
    const session = resultatInscription.data

    this.envoyerMessageConseiller(
      beneficiaire.id,
      beneficiaire.conseiller.id,
      session
    )
    this.notificationService.notifierAutoinscriptionSession(
      session,
      beneficiaire
    )

    return emptySuccess()
  }

  async authorize(
    command: AutoinscrireBeneficiaireSessionMiloCommand,
    utilisateur: Authentification.Utilisateur,
    aggregate?: JeuneMilo
  ): Promise<Result> {
    if (!aggregate)
      return failure(new NonTrouveError('Bénéficiaire', command.idBeneficiaire))

    if (
      !Authentification.estJeune(utilisateur.type) ||
      aggregate.id !== utilisateur.id
    )
      return failure(new DroitsInsuffisants())

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.SESSION_AUTOINSCRIPTION,
      utilisateur
    )
  }

  private async recupererBeneficiaire(
    idBeneficiaire: string,
    aggregate?: JeuneMilo
  ): Promise<Result<BeneficiaireMilo>> {
    if (!aggregate)
      return failure(new NonTrouveError('Bénéficiaire', idBeneficiaire))

    if (!aggregate.conseiller) {
      return failure(
        new NonTraitableError(
          'Beneficiaire',
          aggregate.id,
          NonTraitableReason.BENEFICIAIRE_SANS_CONSEILLER
        )
      )
    }
    if (!aggregate.idPartenaire) {
      return failure(new JeuneMiloSansIdDossier(aggregate.id))
    }

    return success({
      ...aggregate,
      conseiller: aggregate.conseiller,
      idPartenaire: aggregate.idPartenaire
    })
  }

  private async inscrireBeneficiaire(
    beneficiaire: BeneficiaireMilo,
    idSession: string,
    accessToken: string
  ): Promise<Result<SessionMiloAllegeeForBeneficiaire>> {
    const resultAccesMilo = await this.recupererAccesMilo(
      accessToken,
      beneficiaire.conseiller.id
    )
    if (isFailure(resultAccesMilo)) return resultAccesMilo
    const { accesMiloBeneficiaire, accesMiloConseiller } = resultAccesMilo.data

    const resultSession = await this.sessionMiloRepository.getForBeneficiaire(
      idSession,
      beneficiaire.idPartenaire,
      accesMiloBeneficiaire,
      beneficiaire.configuration.fuseauHoraire ?? 'Europe/Paris'
    )
    if (isFailure(resultSession)) return resultSession
    const sessionAllegee = resultSession.data

    const verificationInscription =
      SessionMilo.peutInscrireBeneficiaire(sessionAllegee)
    if (isFailure(verificationInscription)) return verificationInscription

    const inscription = await this.sessionMiloRepository.inscrireBeneficiaire(
      { id: idSession, dateDebut: sessionAllegee.debut },
      beneficiaire.idPartenaire,
      accesMiloConseiller
    )
    if (isFailure(inscription)) return inscription

    return success(sessionAllegee)
  }

  private async envoyerMessageConseiller(
    idBeneficiaire: string,
    idConseiller: string,
    session: SessionMiloAllegeeForBeneficiaire
  ): Promise<void> {
    const conversation =
      await this.chatRepository.recupererConversationIndividuelle(
        idBeneficiaire
      )
    if (!conversation) {
      this.logger.error({ message: 'Aucune conversation trouvée' })
      return
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
        type: 'AUTO_INSCRIPTION',
        infoSession: {
          id: session.id,
          titre: session.nom
        }
      },
      { sentByBeneficiaire: true }
    )
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
