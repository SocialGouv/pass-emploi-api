import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { ArchiveJeune } from '../../domain/archive-jeune'
import { FirebaseClient } from '../clients/firebase-client'
import { ActionSqlModel } from '../sequelize/models/action.sql-model'
import { ArchiveJeuneSqlModel } from '../sequelize/models/archive-jeune.sql-model'
import { CommentaireSqlModel } from '../sequelize/models/commentaire.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../sequelize/models/favori-offre-immersion.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../sequelize/models/recherche.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import { TransfertConseillerSqlModel } from '../sequelize/models/transfert-conseiller.sql-model'
import { toFavoriOffreEmploi } from './mappers/offres-emploi.mappers'
import { fromSqlToFavorisOffreImmersion } from './mappers/offres-immersion.mappers'
import { fromSqlToRecherche } from './mappers/recherches.mappers'
import { sqlToOffreServiceCivique } from './mappers/service-civique.mapper'

@Injectable()
export class ArchiveJeuneSqlRepository implements ArchiveJeune.Repository {
  constructor(private firebaseClient: FirebaseClient) {}

  async archiver(metadonnees: ArchiveJeune.Metadonnees): Promise<Result> {
    const archiveResult = await this.construire(metadonnees)
    if (isFailure(archiveResult)) return archiveResult

    await ArchiveJeuneSqlModel.destroy({
      where: {
        idJeune: metadonnees.idJeune
      }
    })

    await ArchiveJeuneSqlModel.creer({
      idJeune: metadonnees.idJeune,
      email: metadonnees.email ?? null,
      prenom: metadonnees.prenomJeune,
      nom: metadonnees.nomJeune,
      structure: metadonnees.structure,
      dispositif: metadonnees.dispositif,
      idPartenaire: metadonnees.idPartenaire ?? null,
      dateCreation: metadonnees.dateCreation,
      datePremiereConnexion: metadonnees.datePremiereConnexion ?? null,
      dateFinAccompagnement: metadonnees.dateFinAccompagnement ?? null,
      motif: metadonnees.motif,
      commentaire: metadonnees.commentaire ?? null,
      dateArchivage: metadonnees.dateArchivage,
      idStructureMilo: archiveResult.data.idStructureMilo,
      donnees: archiveResult.data.donnees
    })

    return emptySuccess()
  }

  async delete(idArchive: number): Promise<void> {
    await ArchiveJeuneSqlModel.destroy({
      where: {
        id: idArchive
      }
    })
  }

  async getIdsArchivesBefore(date: Date): Promise<number[]> {
    const archivesSql = await ArchiveJeuneSqlModel.findAll({
      attributes: ['id'],
      where: {
        dateArchivage: {
          [Op.lte]: date
        }
      }
    })

    return archivesSql.map(archive => archive.id)
  }

  private async construire(
    metadonnes: ArchiveJeune.Metadonnees
  ): Promise<
    Result<{ donnees: ArchiveJeune; idStructureMilo: string | null }>
  > {
    const idJeune = metadonnes.idJeune

    const messages = await this.firebaseClient.getChatAArchiver(idJeune)
    const jeuneSqlModel = await JeuneSqlModel.findByPk(idJeune, {
      include: [
        ConseillerSqlModel,
        {
          model: TransfertConseillerSqlModel,
          include: [
            {
              as: 'conseillerSource',
              model: ConseillerSqlModel
            },
            {
              as: 'conseillerCible',
              model: ConseillerSqlModel
            }
          ]
        }
      ]
    })

    if (!jeuneSqlModel) {
      return failure(new MauvaiseCommandeError('Jeune déjà supprimé'))
    }

    const rdv = await RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: idJeune },
          include: [ConseillerSqlModel]
        }
      ]
    })
    const actions = await ActionSqlModel.findAll({
      include: [
        {
          model: CommentaireSqlModel
        }
      ],
      where: { idJeune }
    })
    const favorisOffreEmploi = await FavoriOffreEmploiSqlModel.findAll({
      where: { idJeune }
    })
    const favorisOffreImmersion = await FavoriOffreImmersionSqlModel.findAll({
      where: { idJeune }
    })
    const favorisOffreEngagement = await FavoriOffreEngagementSqlModel.findAll({
      where: { idJeune }
    })
    const recherches = await RechercheSqlModel.findAll({
      where: { idJeune }
    })

    return success({
      donnees: this.mapToArchiveJeune(
        jeuneSqlModel,
        metadonnes,
        rdv,
        actions,
        favorisOffreEmploi,
        favorisOffreImmersion,
        favorisOffreEngagement,
        recherches,
        messages
      ),
      idStructureMilo: jeuneSqlModel.idStructureMilo ?? null
    })
  }

  private mapToArchiveJeune(
    jeuneSqlModel: JeuneSqlModel,
    metadonnes: ArchiveJeune.Metadonnees,
    rdv: RendezVousSqlModel[],
    actions: ActionSqlModel[],
    favorisOffreEmploi: FavoriOffreEmploiSqlModel[],
    favorisOffreImmersion: FavoriOffreImmersionSqlModel[],
    favorisOffreEngagement: FavoriOffreEngagementSqlModel[],
    recherches: RechercheSqlModel[],
    messages: ArchiveJeune.Message[]
  ): ArchiveJeune {
    return {
      rendezVous: rdv.map(this.toRendezVousArchive),
      actions: this.fromActionSqlToActionArchive(actions, metadonnes),
      favoris: {
        offresEmploi: favorisOffreEmploi.map(toFavoriOffreEmploi),
        offresImmersions: favorisOffreImmersion.map(
          fromSqlToFavorisOffreImmersion
        ),
        offresServiceCivique: favorisOffreEngagement.map(
          sqlToOffreServiceCivique
        )
      },
      recherches: recherches.map(fromSqlToRecherche),
      dernierConseiller: {
        nom: jeuneSqlModel.conseiller?.nom || '',
        prenom: jeuneSqlModel.conseiller?.prenom || ''
      },
      historiqueConseillers:
        jeuneSqlModel.transferts?.map(transfertSql => ({
          conseillerSource: {
            prenom: transfertSql.conseillerSource.prenom,
            nom: transfertSql.conseillerSource.nom
          },
          conseillerCible: {
            prenom: transfertSql.conseillerCible.prenom,
            nom: transfertSql.conseillerCible.nom
          },
          dateDeTransfert: transfertSql.dateTransfert
        })) ?? [],
      messages
    }
  }

  private toRendezVousArchive(
    rdvSql: RendezVousSqlModel
  ): ArchiveJeune.RendezVous {
    return {
      titre: rdvSql.titre,
      sousTitre: rdvSql.sousTitre,
      commentaire: rdvSql.commentaire || undefined,
      modalite: rdvSql.modalite || undefined,
      date: rdvSql.date,
      duree: rdvSql.duree,
      type: rdvSql.type,
      precision: rdvSql.precision || undefined,
      adresse: rdvSql.adresse || undefined,
      organisme: rdvSql.organisme || undefined,
      presenceConseiller: Boolean(rdvSql.presenceConseiller)
    }
  }

  private fromActionSqlToActionArchive(
    actions: ActionSqlModel[],
    metadonnes: ArchiveJeune.Metadonnees
  ): ArchiveJeune.Action[] {
    return actions.map(
      (actionSql): ArchiveJeune.Action => ({
        description: actionSql.description || '',
        contenu: actionSql.contenu || '',
        statut: actionSql.statut || '',
        dateCreation: actionSql.dateCreation,
        creePar:
          actionSql.idCreateur === metadonnes.idJeune ? 'JEUNE' : 'CONSEILLER',
        dateActualisation: actionSql.dateDerniereActualisation,
        dateEcheance: actionSql.dateEcheance ?? undefined,
        commentaires: actionSql.commentaires.map(commentaireSql => {
          return {
            date: commentaireSql.date,
            message: commentaireSql.message,
            creePar:
              commentaireSql.createur.type === Action.TypeCreateur.JEUNE
                ? 'JEUNE'
                : 'CONSEILLER'
          }
        })
      })
    )
  }
}
