import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Command } from '../../building-blocks/types/command'
import { Authentification } from '../../domain/authentification'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Inject, Injectable } from '@nestjs/common'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { Agence, AgenceRepositoryToken } from '../../domain/agence'
import {
  AnimationCollective,
  AnimationCollectiveRepositoryToken
} from '../../domain/rendez-vous/animation-collective'
import { JeuneDuRendezVous } from '../../domain/rendez-vous/rendez-vous'
import { ChangementAgenceQueryModel } from '../queries/query-models/changement-agence.query-model'

export interface ChangerAgenceCommand extends Command {
  idConseiller: string
  idAgenceCible: string
}

@Injectable()
export class ChangerAgenceCommandHandler extends CommandHandler<
  ChangerAgenceCommand,
  ChangementAgenceQueryModel[]
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(AgenceRepositoryToken)
    private agencesRepository: Agence.Repository,
    @Inject(AnimationCollectiveRepositoryToken)
    private animationCollectiveRepository: AnimationCollective.Repository,
    private animationCollectiveService: AnimationCollective.Service
  ) {
    super('ChangerAgenceCommandHandler')
  }

  async authorize(
    _command: ChangerAgenceCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type !== Authentification.Type.SUPPORT) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async handle(
    command: ChangerAgenceCommand
  ): Promise<Result<ChangementAgenceQueryModel[]>> {
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
      command.idAgenceCible,
      conseiller.structure
    )
    if (!agence?.id) {
      return failure(new NonTrouveError('Agence', command.idAgenceCible))
    }

    if (conseiller.agence.id === agence.id) {
      return failure(
        new MauvaiseCommandeError('Le conseiller est déjà dans cette agence')
      )
    }

    const animationsCollectives =
      await this.animationCollectiveRepository.getAllNonClosesParEtablissement(
        conseiller.agence.id
      )

    const changementAgenceQueryModel = await Promise.all(
      animationsCollectives.map(animationCollective =>
        this.mettreAJour(animationCollective, conseiller, agence)
      )
    )

    const conseillerMisAJour = Conseiller.changerEtablissement(
      conseiller,
      agence
    )
    await this.conseillerRepository.save(conseillerMisAJour)

    return success(changementAgenceQueryModel.filter(isDefined))
  }

  private async mettreAJour(
    animationCollective: AnimationCollective,
    conseiller: Conseiller,
    agence: Agence
  ): Promise<ChangementAgenceQueryModel | undefined> {
    if (animationCollective.createur.id === conseiller.id) {
      const autresJeunes = getAutresJeunesDeLAgence(
        animationCollective,
        conseiller
      )
      if (autresJeunes.length) {
        await this.animationCollectiveService.desinscrire(
          animationCollective,
          autresJeunes.map(jeune => jeune.id)
        )
      }
      await this.animationCollectiveService.mettreAJourEtablissement(
        animationCollective,
        agence.id!
      )
      return buildQueryModel(animationCollective, autresJeunes, agence.id)
    } else {
      const jeunesDuConseillerInscrits = getJeunesDuConseiller(
        animationCollective,
        conseiller
      )
      if (jeunesDuConseillerInscrits.length) {
        await this.animationCollectiveService.desinscrire(
          animationCollective,
          jeunesDuConseillerInscrits.map(jeune => jeune.id)
        )
        return buildQueryModel(animationCollective, jeunesDuConseillerInscrits)
      }
      return undefined
    }
  }

  async monitor(): Promise<void> {
    return
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

function buildQueryModel(
  animationCollective: AnimationCollective,
  jeunesDesinscrits: JeuneDuRendezVous[],
  idNouvelleAgence?: string
): ChangementAgenceQueryModel {
  return {
    idAnimationCollective: animationCollective.id,
    titreAnimationCollective: animationCollective.titre,
    jeunesDesinscrits: jeunesDesinscrits.map(jeune => ({
      id: jeune.id,
      nom: jeune.lastName,
      prenom: jeune.firstName
    })),
    idNouvelleAgence: idNouvelleAgence ?? animationCollective.idAgence!,
    idAncienneAgence: animationCollective.idAgence!
  }
}

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}
