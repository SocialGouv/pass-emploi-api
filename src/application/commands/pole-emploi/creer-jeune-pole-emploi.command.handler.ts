import { Inject, Injectable } from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  EmailExisteDejaError,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../../domain/chat'
import { Core, beneficiaireEstFTConnect } from '../../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../../domain/milo/conseiller'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'

export interface CreateJeuneCommand extends Command {
  idConseiller: string
  firstName: string
  lastName: string
  email: string
}

@Injectable()
export class CreerJeunePoleEmploiCommandHandler extends CommandHandler<
  CreateJeuneCommand,
  Jeune
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private jeuneFactory: Jeune.Factory
  ) {
    super('CreerJeunePoleEmploiCommandHandler')
  }

  async handle(command: CreateJeuneCommand): Promise<Result<Jeune>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    const lowerCaseEmail = command.email.toLocaleLowerCase()
    const jeune = await this.jeuneRepository.getByEmail(lowerCaseEmail)
    if (jeune) {
      return failure(new EmailExisteDejaError(lowerCaseEmail))
    }

    const jeuneACreer: Jeune.Factory.ACreer = {
      prenom: command.firstName,
      nom: command.lastName,
      email: lowerCaseEmail,
      conseiller: {
        id: conseiller.id,
        lastName: conseiller.lastName,
        firstName: conseiller.firstName,
        email: conseiller.email
      },
      structure: conseiller.structure,
      dispositif: fromStructureFTToDispositif(conseiller.structure)
    }
    const nouveauJeune = this.jeuneFactory.creer(jeuneACreer)
    await this.jeuneRepository.save(nouveauJeune)
    await this.chatRepository.initializeChatIfNotExists(
      nouveauJeune.id,
      nouveauJeune.conseiller!.id
    )
    return success(nouveauJeune)
  }

  async authorize(
    command: CreateJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur,
      beneficiaireEstFTConnect(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

function fromStructureFTToDispositif(
  structure: Core.Structure
): Jeune.Dispositif {
  switch (structure) {
    case Core.Structure.POLE_EMPLOI:
      return Jeune.Dispositif.CEJ
    case Core.Structure.POLE_EMPLOI_AIJ:
      return Jeune.Dispositif.AIJ
    case Core.Structure.POLE_EMPLOI_BRSA:
      return Jeune.Dispositif.BRSA
    case Core.Structure.CONSEIL_DEPT:
      return Jeune.Dispositif.CONSEIL_DEPT
    case Core.Structure.AVENIR_PRO:
      return Jeune.Dispositif.AVENIR_PRO
    case Core.Structure.FT_ACCOMPAGNEMENT_INTENSIF:
      return Jeune.Dispositif.ACCOMPAGNEMENT_INTENSIF
    case Core.Structure.FT_ACCOMPAGNEMENT_GLOBAL:
      return Jeune.Dispositif.ACCOMPAGNEMENT_GLOBAL
    case Core.Structure.FT_EQUIP_EMPLOI_RECRUT:
      return Jeune.Dispositif.EQUIP_EMPLOI_RECRUT
    case Core.Structure.MILO:
      throw new RuntimeException()
  }
}
