import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Inject, Injectable } from '@nestjs/common'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { Command } from '../../building-blocks/types/command'
import { DateService } from '../../utils/date-service'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { Op } from 'sequelize'
import { FavoriOffreEmploiSqlModel } from '../../infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { uneActionJdd } from '../../infrastructure/jdd/action.jdd'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { Action } from '../../domain/action/action'
import { unRendezVousJDD } from '../../infrastructure/jdd/rendez-vous.jdd'
import { CodeTypeRendezVous } from '../../domain/rendez-vous/rendez-vous'
import { AsSql } from '../../infrastructure/sequelize/types'
import { Qualification } from '../../domain/action/qualification'
import { SituationsMiloSqlModel } from '../../infrastructure/sequelize/models/situations-milo.sql-model'
import { uneSituationsMiloJdd } from '../../infrastructure/jdd/situation.jdd'
import { RechercheSqlModel } from '../../infrastructure/sequelize/models/recherche.sql-model'
import { uneRechercheJdd } from '../../infrastructure/jdd/recherche.jdd'
import { unFavoriOffreEmploiJdd } from '../../infrastructure/jdd/favori.jdd'
import Code = Qualification.Code

export interface GenererJDDJobHandler extends Command {
  job: Planificateur.Job<Planificateur.JobGenererJDD>
}

@Injectable()
@ProcessJobType(Planificateur.JobType.GENERER_JDD)
export class HandleJobGenererJDDCommandHandler extends JobHandler<GenererJDDJobHandler> {
  constructor(
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    private dateService: DateService
  ) {
    super(Planificateur.JobType.GENERER_JDD, suiviJobService)
  }

  async handle(command: GenererJDDJobHandler): Promise<SuiviJob> {
    const debut = this.dateService.now()
    try {
      const { idConseiller, menage } = command.job.contenu

      const conseiller = await ConseillerSqlModel.findOne({
        where: {
          id: idConseiller
        }
      })

      if (!conseiller) {
        throw new Error(`Conseiller ${idConseiller} introuvable`)
      }

      const jeunesDuConseiller = await JeuneSqlModel.findAll({
        where: {
          idConseiller
        }
      })

      const jeunesIds = jeunesDuConseiller.map(jeune => jeune.id)
      if (menage) {
        await onFaitLeMenage(jeunesIds)
      }
      const [
        unRendezVousIndividuel,
        unRendezVousAvecPlusieursJeunes,
        uneAnimationCollectiveAVenir,
        uneAnimationCollective,
        uneAnimationCollectivePasClose
      ] = await this.onCreeDesRendezVous(conseiller)

      for (const jeune of jeunesDuConseiller) {
        await this.onCreeDesActions(conseiller, jeune)
        await this.onCreeUneBonneSituation(jeune)
        await this.onCreeUneRechercheSauvegardee(jeune)
        await this.onCreeUnFavori(jeune)
        await this.onInscritLesJeunesAuxRendezVous(jeune, [
          unRendezVousIndividuel,
          unRendezVousAvecPlusieursJeunes,
          uneAnimationCollectiveAVenir,
          uneAnimationCollective,
          uneAnimationCollectivePasClose
        ])
      }

      return {
        jobType: this.jobType,
        nbErreurs: 0,
        succes: true,
        tempsExecution: DateService.calculerTempsExecution(debut),
        resultat: {},
        dateExecution: debut
      }
    } catch (e) {
      this.logger.error(e)
      return {
        jobType: this.jobType,
        nbErreurs: 1,
        succes: false,
        tempsExecution: DateService.calculerTempsExecution(debut),
        resultat: {},
        dateExecution: debut,
        erreur: e
      }
    }
  }

  private async onCreeDesActions(
    conseiller: ConseillerSqlModel,
    jeune: JeuneSqlModel
  ): Promise<void> {
    const actionAFaireDemain = uneActionJdd({
      idCreateur: conseiller.id,
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      idJeune: jeune.id,
      contenu: 'Ma première action',
      statut: Action.Statut.PAS_COMMENCEE,
      dateEcheance: this.dateService.now().plus({ days: 1 }).toJSDate()
    })
    const actionFinito = uneActionJdd({
      idCreateur: conseiller.id,
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      idJeune: jeune.id,
      contenu: 'Ma deuxieme action',
      statut: Action.Statut.TERMINEE,
      dateEcheance: this.dateService.now().minus({ days: 1 }).toJSDate()
    })
    const actionFinitoDeLaSNPIto = uneActionJdd({
      idCreateur: conseiller.id,
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      idJeune: jeune.id,
      contenu: 'Ma belle SNP',
      statut: Action.Statut.TERMINEE,
      dateEcheance: this.dateService.now().minus({ days: 1 }).toJSDate(),
      codeQualification: Code.FORMATION,
      dateFinReelle: this.dateService.now().minus({ days: 1 }).toJSDate()
    })
    const actionRetardito = uneActionJdd({
      idCreateur: conseiller.id,
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      idJeune: jeune.id,
      contenu: 'Ma troisieme action',
      statut: Action.Statut.EN_COURS,
      dateEcheance: this.dateService.now().minus({ days: 7 }).toJSDate()
    })
    await ActionSqlModel.bulkCreate([
      actionAFaireDemain,
      actionFinito,
      actionRetardito,
      actionFinitoDeLaSNPIto
    ])
  }

  private async onCreeUneBonneSituation(jeune: JeuneSqlModel): Promise<void> {
    const situationJdd = uneSituationsMiloJdd({
      idJeune: jeune.id
    })
    await SituationsMiloSqlModel.create(situationJdd)
  }

  private async onCreeUneRechercheSauvegardee(
    jeune: JeuneSqlModel
  ): Promise<void> {
    const laRecherche = uneRechercheJdd({
      idJeune: jeune.id
    })
    await RechercheSqlModel.create(laRecherche)
  }

  private async onCreeUnFavori(jeune: JeuneSqlModel): Promise<void> {
    const leFavori = unFavoriOffreEmploiJdd({
      idJeune: jeune.id,
      dateCreation: this.dateService.now().minus({ days: 1 }).toJSDate()
    })
    await FavoriOffreEmploiSqlModel.create(leFavori)
  }

  private async onCreeDesRendezVous(
    conseiller: ConseillerSqlModel
  ): Promise<Array<AsSql<RendezVousDto>>> {
    const unRendezVousIndividuel = unRendezVousJDD({
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      presenceConseiller: true,
      commentaire: 'Mon premier rendez-vous',
      titre: 'Mon premier rendez-vous',
      invitation: false,
      date: this.dateService.now().plus({ days: 2 }).toJSDate()
    })

    const unRendezVousAvecPlusieursJeunes = unRendezVousJDD({
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      type: CodeTypeRendezVous.AUTRE,
      presenceConseiller: true,
      commentaire: 'Mon deuxieme rendez-vous',
      titre: 'Mon deuxieme rendez-vous',
      invitation: false,
      date: this.dateService.now().minus({ days: 1 }).toJSDate()
    })

    const uneAnimationCollectiveAVenir = unRendezVousJDD({
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      type: CodeTypeRendezVous.ATELIER,
      presenceConseiller: false,
      commentaire: 'Mon AC',
      titre: 'Un atelier',
      invitation: false,
      date: this.dateService.now().plus({ days: 4 }).toJSDate(),
      idAgence: '9999'
    })

    const uneAnimationCollectiveClose = unRendezVousJDD({
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      type: CodeTypeRendezVous.ATELIER,
      presenceConseiller: false,
      commentaire: 'Mon AC Close',
      titre: 'Une AC',
      invitation: false,
      date: this.dateService.now().minus({ days: 1 }).toJSDate(),
      dateCloture: this.dateService.now().toJSDate(),
      idAgence: '9999'
    })

    const uneAnimationCollectivePasClose = unRendezVousJDD({
      createur: {
        id: conseiller.id,
        nom: conseiller.nom,
        prenom: conseiller.prenom
      },
      type: CodeTypeRendezVous.ATELIER,
      presenceConseiller: false,
      commentaire: 'Mon AC à clore',
      titre: 'Mon AC à clore',
      invitation: false,
      date: this.dateService.now().minus({ days: 1 }).toJSDate(),
      dateCloture: null,
      idAgence: '9999'
    })

    const lesRendezVous: Array<AsSql<RendezVousDto>> = [
      unRendezVousIndividuel,
      unRendezVousAvecPlusieursJeunes,
      uneAnimationCollectiveAVenir,
      uneAnimationCollectiveClose,
      uneAnimationCollectivePasClose
    ]
    await RendezVousSqlModel.bulkCreate(lesRendezVous)

    return lesRendezVous
  }

  private async onInscritLesJeunesAuxRendezVous(
    jeune: JeuneSqlModel,
    lesRendezVous: Array<AsSql<RendezVousDto>>
  ): Promise<void> {
    const [
      unRendezVousIndividuel,
      unRendezVousAvecPlusieursJeunes,
      uneAnimationCollectiveAVenir,
      uneAnimationCollective,
      uneAnimationCollectivePasClose
    ] = lesRendezVous
    await RendezVousJeuneAssociationSqlModel.bulkCreate([
      {
        idRendezVous: unRendezVousIndividuel.id,
        idJeune: jeune.id
      },
      {
        idRendezVous: unRendezVousAvecPlusieursJeunes.id,
        idJeune: jeune.id
      },
      {
        idRendezVous: uneAnimationCollectiveAVenir.id,
        idJeune: jeune.id
      },
      {
        idRendezVous: uneAnimationCollective.id,
        idJeune: jeune.id,
        presence: true
      },
      {
        idRendezVous: uneAnimationCollectivePasClose.id,
        idJeune: jeune.id
      }
    ])
  }
}

async function onFaitLeMenage(jeunesIds: string[]): Promise<void> {
  await ActionSqlModel.destroy({
    where: {
      idJeune: {
        [Op.in]: jeunesIds
      }
    }
  })
  const rendezVousAvecLesJeunes =
    await RendezVousJeuneAssociationSqlModel.findAll({
      where: {
        idJeune: {
          [Op.in]: jeunesIds
        }
      }
    })
  await RendezVousJeuneAssociationSqlModel.destroy({
    where: {
      id: {
        [Op.in]: rendezVousAvecLesJeunes.map(rdv => rdv.id)
      }
    }
  })
  await RendezVousSqlModel.destroy({
    where: {
      id: {
        [Op.in]: rendezVousAvecLesJeunes.map(rdv => rdv.idRendezVous)
      }
    }
  })
  await FavoriOffreEmploiSqlModel.destroy({
    where: {
      idJeune: {
        [Op.in]: jeunesIds
      }
    }
  })

  await SituationsMiloSqlModel.destroy({
    where: {
      idJeune: {
        [Op.in]: jeunesIds
      }
    }
  })

  await RechercheSqlModel.destroy({
    where: {
      idJeune: {
        [Op.in]: jeunesIds
      }
    }
  })

  await FavoriOffreEmploiSqlModel.destroy({
    where: {
      idJeune: {
        [Op.in]: jeunesIds
      }
    }
  })
}
