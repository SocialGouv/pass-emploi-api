import { ArchiveJeune } from '../../domain/archive-jeune'
import { Injectable } from '@nestjs/common'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import { ActionSqlModel } from '../sequelize/models/action.sql-model'
import { FavoriOffreEmploiSqlModel } from '../sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreImmersionSqlModel } from '../sequelize/models/favori-offre-immersion.sql-model'
import { FavoriOffreEngagementSqlModel } from '../sequelize/models/favori-offre-engagement.sql-model'
import { RechercheSqlModel } from '../sequelize/models/recherche.sql-model'
import { toOffreEmploi } from './mappers/offres-emploi.mappers'
import { fromSqlToOffreImmersion } from './mappers/offres-immersion.mappers'
import { fromSqlToOffreServiceCivique } from './mappers/service-civique.mapper'
import { fromSqlToRecherche } from './mappers/recherches.mappers'
import { TransfertConseillerSqlModel } from '../sequelize/models/transfert-conseiller.sql-model'
import { ArchiveJeuneSqlModel } from '../sequelize/models/archive-jeune.sql-model'
import { FirebaseClient } from '../clients/firebase-client'

@Injectable()
export class ArchiveJeuneSqlRepository implements ArchiveJeune.Repository {
  constructor(private firebaseClient: FirebaseClient) {}

  async archiver(metadonnees: ArchiveJeune.Metadonnees): Promise<void> {
    const archive = await this.construire(metadonnees)
    await ArchiveJeuneSqlModel.create({
      idJeune: metadonnees.idJeune,
      email: metadonnees.email,
      prenom: metadonnees.prenomJeune,
      nom: metadonnees.nomJeune,
      motif: metadonnees.motif,
      commentaire: metadonnees.commentaire,
      dateArchivage: metadonnees.dateArchivage,
      donnees: archive
    })
  }

  private async construire(
    metadonnes: ArchiveJeune.Metadonnees
  ): Promise<ArchiveJeune | undefined> {
    const messages = await this.firebaseClient.getChat(metadonnes.idJeune)
    const jeuneSqlModel = await JeuneSqlModel.findByPk(metadonnes.idJeune, {
      include: [
        ConseillerSqlModel,
        RendezVousSqlModel,
        ActionSqlModel,
        FavoriOffreEmploiSqlModel,
        FavoriOffreImmersionSqlModel,
        FavoriOffreEngagementSqlModel,
        RechercheSqlModel,
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
      return undefined
    }

    return this.mapToArchiveJeune(jeuneSqlModel, metadonnes, messages)
  }

  private mapToArchiveJeune(
    jeuneSqlModel: JeuneSqlModel,
    metadonnes: ArchiveJeune.Metadonnees,
    messages: ArchiveJeune.Message[]
  ): ArchiveJeune {
    return {
      rendezVous: jeuneSqlModel.rdv.map(this.toRendezVousArchive),
      actions: this.fromActionSqlToActionArchive(jeuneSqlModel, metadonnes),
      favoris: {
        offresEmploi: jeuneSqlModel.favorisOffreEmploi.map(toOffreEmploi),
        offresImmersions: jeuneSqlModel.favorisOffreImmersion.map(
          fromSqlToOffreImmersion
        ),
        offresServiceCivique: jeuneSqlModel.favorisOffreEngagement.map(
          fromSqlToOffreServiceCivique
        )
      },
      recherches: jeuneSqlModel.recherches.map(fromSqlToRecherche),
      dernierConseiller: {
        nom: jeuneSqlModel.conseiller?.nom || '',
        prenom: jeuneSqlModel.conseiller?.prenom || ''
      },
      historiqueConseillers: jeuneSqlModel.transferts.map(transfertSql => ({
        conseillerSource: {
          prenom: transfertSql.conseillerSource.prenom,
          nom: transfertSql.conseillerSource.nom
        },
        conseillerCible: {
          prenom: transfertSql.conseillerCible.prenom,
          nom: transfertSql.conseillerCible.nom
        },
        dateDeTransfert: transfertSql.dateTransfert
      })),
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
    jeuneSqlModel: JeuneSqlModel,
    metadonnes: ArchiveJeune.Metadonnees
  ): ArchiveJeune.Action[] {
    return jeuneSqlModel.actions.map(actionSql => ({
      commentaire: actionSql.commentaire || '',
      contenu: actionSql.contenu || '',
      statut: actionSql.statut || '',
      dateCreation: actionSql.dateCreation,
      creePar:
        actionSql.idCreateur === metadonnes.idJeune ? 'JEUNE' : 'CONSEILLER',
      dateActualisation: actionSql.dateDerniereActualisation,
      dateLimite: actionSql.dateLimite || undefined
    }))
  }
}
