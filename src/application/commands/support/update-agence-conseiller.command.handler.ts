import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../building-blocks/types/domain-error'
import { Result, failure, success } from '../../../building-blocks/types/result'
import { Agence, AgenceRepositoryToken } from '../../../domain/agence'
import { Authentification } from '../../../domain/authentification'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../../domain/conseiller'
import {
  AnimationCollective,
  AnimationCollectiveRepositoryToken
} from '../../../domain/rendez-vous/animation-collective'
import { JeuneDuRendezVous } from '../../../domain/rendez-vous/rendez-vous'

import { ApiProperty } from '@nestjs/swagger'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'

enum AgenceTransferee {
  OUI = 'OUI (le conseiller était créateur)',
  NON = "NON (le conseiller n'était pas le créateur)"
}

class JeuneDesinscrit {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

class InfoTransfertACQueryModel {
  @ApiProperty()
  idAnimationCollective: string

  @ApiProperty()
  titreAnimationCollective: string

  @ApiProperty()
  agenceTransferee: AgenceTransferee

  @ApiProperty({ isArray: true, type: JeuneDesinscrit })
  jeunesDesinscrits: JeuneDesinscrit[]
}

export class ChangementAgenceQueryModel {
  @ApiProperty()
  idAncienneAgence: string

  @ApiProperty()
  idNouvelleAgence: string

  @ApiProperty({ isArray: true, type: InfoTransfertACQueryModel })
  infosTransfertAnimationsCollectives: InfoTransfertACQueryModel[]
}

export interface UpdateAgenceConseillerCommand extends Command {
  idConseiller: string
  idNouvelleAgence: string
}

@Injectable()
export class UpdateAgenceConseillerCommandHandler extends CommandHandler<
  UpdateAgenceConseillerCommand,
  ChangementAgenceQueryModel
> {
  constructor(
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(AgenceRepositoryToken)
    private agencesRepository: Agence.Repository,
    @Inject(AnimationCollectiveRepositoryToken)
    private animationCollectiveRepository: AnimationCollective.Repository,
    private animationCollectiveService: AnimationCollective.Service,
    private supportAuthorizer: SupportAuthorizer
  ) {
    super('UpdateAgenceConseillerCommandHandler')
  }

  async authorize(
    _command: UpdateAgenceConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }
  async monitor(): Promise<void> {
    return
  }

  async handle(
    command: UpdateAgenceConseillerCommand
  ): Promise<Result<ChangementAgenceQueryModel>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', command.idConseiller))
    }

    if (!conseiller.agence?.id) {
      return failure(
        new MauvaiseCommandeError("Le conseiller n'a pas d'agence")
      )
    }

    const agence = await this.agencesRepository.get(
      command.idNouvelleAgence,
      conseiller.structure
    )
    if (!agence?.id) {
      return failure(new NonTrouveError('Agence', command.idNouvelleAgence))
    }

    if (conseiller.agence.id === agence.id) {
      return failure(
        new MauvaiseCommandeError('Le conseiller est déjà dans cette agence')
      )
    }

    const animationsCollectives =
      await this.animationCollectiveRepository.getAllByEtablissementAvecSupprimes(
        conseiller.agence.id
      )

    const infosTransfertAnimationsCollectives = await Promise.all(
      animationsCollectives.map(animationCollective =>
        this.updateAnimationCollective(animationCollective, conseiller, agence)
      )
    )

    const updatedConseiller = Conseiller.modifierAgence(conseiller, agence)
    await this.conseillerRepository.save(updatedConseiller)

    return success({
      idNouvelleAgence: command.idNouvelleAgence,
      idAncienneAgence: conseiller.agence.id,
      infosTransfertAnimationsCollectives
    })
  }

  private async updateAnimationCollective(
    animationCollective: AnimationCollective,
    conseiller: Conseiller,
    agence: Agence
  ): Promise<InfoTransfertACQueryModel> {
    if (animationCollective.createur.id === conseiller.id) {
      const jeunesDesinscrits = await this.changerAgenceAnimationCollective(
        animationCollective,
        conseiller,
        agence
      )
      return {
        idAnimationCollective: animationCollective.id,
        titreAnimationCollective: animationCollective.titre,
        agenceTransferee: AgenceTransferee.OUI,
        jeunesDesinscrits: jeunesDesinscrits.map(jeune => ({
          id: jeune.id,
          nom: jeune.lastName,
          prenom: jeune.firstName
        }))
      }
    } else {
      const jeunesDesinscrits =
        await this.desinscrireJeunesDuConseillerDeLAnimationCollective(
          animationCollective,
          conseiller
        )
      return {
        idAnimationCollective: animationCollective.id,
        titreAnimationCollective: animationCollective.titre,
        agenceTransferee: AgenceTransferee.NON,
        jeunesDesinscrits: jeunesDesinscrits.map(jeune => ({
          id: jeune.id,
          nom: jeune.lastName,
          prenom: jeune.firstName
        }))
      }
    }
  }

  private async changerAgenceAnimationCollective(
    animationCollective: AnimationCollective,
    conseiller: Conseiller,
    agence: Agence
  ): Promise<JeuneDuRendezVous[]> {
    const autresJeunes = getAutresJeunesDeLAgence(
      animationCollective,
      conseiller
    )
    if (autresJeunes.length !== 0) {
      await this.animationCollectiveService.desinscrireJeunesDeLAnimationCollective(
        animationCollective,
        autresJeunes.map(jeune => jeune.id)
      )
    }
    await this.animationCollectiveService.updateEtablissement(
      animationCollective,
      agence.id!
    )
    return autresJeunes
  }

  private async desinscrireJeunesDuConseillerDeLAnimationCollective(
    animationCollective: AnimationCollective,
    conseiller: Conseiller
  ): Promise<JeuneDuRendezVous[]> {
    const jeunesDuConseillerInscrits = getJeunesDuConseiller(
      animationCollective,
      conseiller
    )
    if (jeunesDuConseillerInscrits.length !== 0) {
      await this.animationCollectiveService.desinscrireJeunesDeLAnimationCollective(
        animationCollective,
        jeunesDuConseillerInscrits.map(jeune => jeune.id)
      )
    }
    return jeunesDuConseillerInscrits
  }
}

function getAutresJeunesDeLAgence(
  animationCollective: AnimationCollective,
  conseiller: Conseiller
): JeuneDuRendezVous[] {
  return animationCollective.jeunes.filter(
    jeune => jeune.conseiller?.id !== conseiller.id
  )
}

function getJeunesDuConseiller(
  animationCollective: AnimationCollective,
  conseiller: Conseiller
): JeuneDuRendezVous[] {
  return animationCollective.jeunes.filter(
    jeune => jeune.conseiller?.id === conseiller.id
  )
}
