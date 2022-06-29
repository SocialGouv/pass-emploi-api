import { ArchivageJeune } from '../../domain/archivage-jeune'
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
import { ArchivageJeuneSqlModel } from '../sequelize/models/archivage-jeune.sql-model'

@Injectable()
export class ArchivageJeuneSqlRepositoryDb
  implements ArchivageJeune.Repository
{
  async archiver(donnees: ArchivageJeune.DonneesArchivees): Promise<void> {
    await ArchivageJeuneSqlModel.create({
      email: donnees.email,
      dateArchivage: donnees.dateSuppression,
      donnees
    })
  }

  async construire(
    jeuneId: string,
    dateSuppression: Date,
    motifDeSuppression: ArchivageJeune.Motif,
    commentaire?: string
  ): Promise<ArchivageJeune.DonneesArchivees | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(jeuneId, {
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

    return {
      nom: jeuneSqlModel.nom,
      prenom: jeuneSqlModel.prenom,
      motifDeSuppression: motifDeSuppression,
      commentaire,
      dateSuppression,
      email: jeuneSqlModel.email || undefined,
      actions: jeuneSqlModel.actions.map(actionSql => ({
        commentaire: actionSql.commentaire || '',
        contenu: actionSql.contenu || '',
        statut: actionSql.statut || '',
        dateCreation: actionSql.dateCreation,
        creePar: actionSql.idCreateur === jeuneId ? 'JEUNE' : 'CONSEILLER',
        dateActualisation: actionSql.dateDerniereActualisation,
        dateLimite: actionSql.dateLimite || undefined
      })),
      favoris: {
        offresEmploi: jeuneSqlModel.favorisOffreEmploi.map(toOffreEmploi),
        offresImmersions: jeuneSqlModel.favorisOffreImmersion.map(
          fromSqlToOffreImmersion
        ),
        offresServiceCivique: jeuneSqlModel.favorisOffreEngagement.map(
          fromSqlToOffreServiceCivique
        )
      },
      rendezVous: jeuneSqlModel.rdv.map(rdvSql => ({
        id: rdvSql.id,
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
        presenceConseiller: Boolean(rdvSql.presenceConseiller),
        invitation: Boolean(rdvSql.invitation)
      })),
      recherches: jeuneSqlModel.recherches.map(fromSqlToRecherche),
      dernierConseiller: {
        nom: jeuneSqlModel.conseiller?.nom || '',
        prenom: jeuneSqlModel.conseiller?.prenom || ''
      },
      historiqueConseillers: jeuneSqlModel.transferts.map(transfertSql => ({
        nom: transfertSql.conseillerCible.nom,
        prenom: transfertSql.conseillerCible.prenom,
        dateDeTransfert: transfertSql.dateTransfert
      }))
    }
  }
}
