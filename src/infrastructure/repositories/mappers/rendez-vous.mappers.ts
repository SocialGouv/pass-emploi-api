import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import { RendezVous } from 'src/domain/rendez-vous'
import {
  RendezVousDto,
  RendezVousSqlModel
} from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export function toRendezVousDto(rendezVous: RendezVous): AsSql<RendezVousDto> {
  return {
    id: rendezVous.id,
    titre: rendezVous.titre,
    sousTitre: rendezVous.sousTitre,
    modalite: rendezVous.modalite,
    duree: rendezVous.duree,
    date: rendezVous.date,
    commentaire: rendezVous.commentaire ?? null,
    dateSuppression: null,
    idConseiller: rendezVous.jeune.conseiller.id,
    idJeune: rendezVous.jeune.id
  }
}

export function fromSqlToRendezVousConseillerQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousQueryModel {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    title: `${rendezVousSql.jeune.prenom} ${rendezVousSql.jeune.nom}`,
    date: rendezVousSql.date,
    modality: rendezVousSql.modalite,
    duration: rendezVousSql.duree
  }
}

export function fromSqlToRendezVousJeuneQueryModel(
  rendezVousSql: RendezVousSqlModel
): RendezVousQueryModel {
  return {
    id: rendezVousSql.id,
    comment: rendezVousSql.commentaire ?? undefined,
    title: `${rendezVousSql.conseiller.prenom} ${rendezVousSql.conseiller.nom}`,
    date: rendezVousSql.date,
    modality: rendezVousSql.modalite,
    duration: rendezVousSql.duree
  }
}
