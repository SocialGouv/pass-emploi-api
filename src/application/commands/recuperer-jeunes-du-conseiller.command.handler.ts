import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { FirebaseClient } from 'src/infrastructure/clients/firebase-client'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface RecupererJeunesDuConseillerCommand extends Command {
  idConseiller: string
}

@Injectable()
export class RecupererJeunesDuConseillerCommandHandler extends CommandHandler<
  RecupererJeunesDuConseillerCommand,
  void
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private firebaseClient: FirebaseClient,
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
        Object.values(jeunesParConseiller).map(jeunesDuConseiller => {
          const idConseillerActuel = jeunesDuConseiller[0].conseiller!.id

          const updatedJeunes: Jeune[] = Jeune.recupererLesJeunes(
            jeunesDuConseiller,
            conseiller
          )

          return this.jeuneRepository.transferAndSaveAll(
            updatedJeunes,
            command.idConseiller,
            idConseillerActuel
          )
        })
      )

      jeunes.forEach(jeune =>
        this.firebaseClient.envoyerMessageTransfertJeune(
          jeune,
          command.idConseiller
        )
      )
    }

    return emptySuccess()
  }

  async authorize(
    command: RecupererJeunesDuConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(command.idConseiller, utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
