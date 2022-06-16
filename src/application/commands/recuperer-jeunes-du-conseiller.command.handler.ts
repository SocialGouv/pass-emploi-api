import { Inject, Injectable } from '@nestjs/common'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
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
      const jeunesParConseiller = separerLesJeunesParConseiller(jeunes)

      await Promise.all(
        Object.values(jeunesParConseiller).map(jeunesDuConseiller => {
          const idConseillerActuel = jeunesDuConseiller[0].conseiller!.id

          const updatedJeunes: Jeune[] = Jeune.changerLeConseillerDesJeunes(
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

function separerLesJeunesParConseiller(jeunes: Jeune[]): {
  [key: string]: Jeune[]
} {
  return jeunes.reduce((res, jeuneActuel) => {
    if (res[jeuneActuel.conseiller!.id]) {
      res[jeuneActuel.conseiller!.id].push(jeuneActuel)
    } else {
      res[jeuneActuel.conseiller!.id] = [jeuneActuel]
    }
    return res
  }, {} as { [key: string]: Jeune[] })
}
