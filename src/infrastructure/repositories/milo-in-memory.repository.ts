import { Injectable } from '@nestjs/common'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Milo } from '../../domain/milo'
import { SituationsMiloSqlModel } from '../sequelize/models/situations_milo.sql-model'

@Injectable()
export class MiloInMemoryRepository implements Milo.Repository {
  dossiers: Milo.Dossier[]

  constructor() {
    this.dossiers = [unDossierMiloAvecEmail(), unDossierMiloSansEmail()]
  }

  async getDossier(idDossier: string): Promise<Result<Milo.Dossier>> {
    const dossier = this.dossiers.find(dossier => dossier.id === idDossier)
    if (dossier) {
      return success(dossier)
    }
    return failure(new ErreurHttp('pas trouvé le dossier john', 404))
  }

  async creerJeune(idDossier: string): Promise<Result> {
    switch (idDossier) {
      case '1':
        return emptySuccess()
      case '3':
        return failure(new ErreurHttp('email', 400))
      default:
        return emptySuccess()
    }
  }

  async saveSituationsJeune(situations: Milo.SituationsDuJeune): Promise<void> {
    await SituationsMiloSqlModel.upsert(
      {
        idJeune: situations.idJeune,
        situationCourante: situations.situationCourante,
        situations: situations.situations
      },
      { conflictFields: ['id_jeune'] }
    )
  }

  async getSituationsByJeune(
    idJeune: string
  ): Promise<Milo.SituationsDuJeune | undefined> {
    const situationsSql = await SituationsMiloSqlModel.findOne({
      where: { idJeune }
    })

    return situationsSql
      ? {
          idJeune: situationsSql.idJeune,
          situationCourante: situationsSql.situationCourante ?? undefined,
          situations: situationsSql.situations
        }
      : undefined
  }
}

const unDossierMiloAvecEmail = (): Milo.Dossier => ({
  id: '1',
  nom: 'Dawson',
  prenom: 'Jack',
  dateDeNaissance: '1888-09-01',
  email: 'jack.dawson@milo.com',
  codePostal: '91580',
  situations: [
    {
      etat: Milo.EtatSituation.PREVU,
      categorie: Milo.CategorieSituation.EMPLOI
    },
    {
      etat: Milo.EtatSituation.EN_COURS,
      categorie: Milo.CategorieSituation.EMPLOI
    }
  ]
})

const unDossierMiloSansEmail = (): Milo.Dossier => ({
  id: '2',
  nom: 'Dylan',
  prenom: 'Bob',
  dateDeNaissance: '1941-05-24',
  codePostal: '75008',
  situations: []
})
