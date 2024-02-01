import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { Chat, ChatRepositoryToken } from '../../domain/chat'

export interface RecupererJeunesDuConseillerCommand extends Command {
  idConseiller: string
}

@Injectable()
export class RecupererJeunesDuConseillerCommandHandler extends CommandHandler<
  RecupererJeunesDuConseillerCommand,
  void
> {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('RecupererJeunesDuConseillerCommandHandler')
  }

  async handle(command: RecupererJeunesDuConseillerCommand): Promise<Result> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)

    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    const jeunes = await this.jeuneRepository.findAllJeunesByConseillerInitial(
      command.idConseiller
    )

    if (jeunes.length) {
      const jeunesParConseiller =
        Jeune.separerLesJeunesParConseillerActuel(jeunes)

      await Promise.all(
        Object.values(jeunesParConseiller).map(async jeunesDuConseiller => {
          const idConseillerActuel = jeunesDuConseiller[0].conseiller!.id

          const updatedJeunes: Jeune[] = Jeune.recupererLesJeunes(
            jeunesDuConseiller,
            conseiller
          )

          await this.jeuneRepository.transferAndSaveAll(
            updatedJeunes,
            command.idConseiller,
            idConseillerActuel,
            command.idConseiller,
            Jeune.TypeTransfert.RECUPERATION
          )
          updatedJeunes.forEach(jeune =>
            this.chatRepository.envoyerMessageTransfert(jeune)
          )
        })
      )
    }

    return emptySuccess()
  }

  async authorize(
    command: RecupererJeunesDuConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
