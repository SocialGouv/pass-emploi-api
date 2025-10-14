import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Op } from 'sequelize'
import {
  ConseillerInactifError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, Result, success } from 'src/building-blocks/types/result'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { Authentification } from '../../domain/authentification'
import { Core, estMilo } from '../../domain/core'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { SuperviseurSqlModel } from '../sequelize/models/superviseur.sql-model'
import {
  fromConseillerSqlToUtilisateur,
  fromJeuneSqlToUtilisateur
} from './mappers/authentification.mappers'

@Injectable()
export class AuthentificationSqlOidcRepository
  implements Authentification.Repository
{
  private logger: Logger

  constructor(private oidcClient: OidcClient) {
    this.logger = new Logger('AuthentificationSqlOidcRepository')
  }

  async getConseiller(
    idUtilisateurAuth: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const conseillerSqlModel = await ConseillerSqlModel.findOne({
      where: {
        idAuthentification: idUtilisateurAuth
      }
    })

    if (conseillerSqlModel) {
      const roles = []
      const estSuperviseur = await this.estConseillerSuperviseur(
        conseillerSqlModel.structure,
        conseillerSqlModel.email
      )
      if (estSuperviseur) roles.push(Authentification.Role.SUPERVISEUR)

      return fromConseillerSqlToUtilisateur(conseillerSqlModel, roles)
    }

    return undefined
  }

  async getJeuneByStructure(
    idUtilisateurAuth: string,
    structure: Core.Structure
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        idAuthentification: idUtilisateurAuth,
        structure
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async getJeuneByIdAuthentification(
    idUtilisateurAuth: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        idAuthentification: idUtilisateurAuth
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async getJeuneById(
    id: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(id)

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async getJeuneByEmail(
    email: string
  ): Promise<Authentification.Utilisateur | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: {
        email: email
      }
    })

    if (jeuneSqlModel) {
      return fromJeuneSqlToUtilisateur(jeuneSqlModel)
    }

    return undefined
  }

  async update(utilisateur: Authentification.Utilisateur): Promise<void> {
    if (Authentification.estJeune(utilisateur.type)) {
      await JeuneSqlModel.update(
        {
          idAuthentification: utilisateur.idAuthentification,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          dateDerniereConnexion: utilisateur.dateDerniereConnexion,
          datePremiereConnexion: utilisateur.datePremiereConnexion
        },
        { where: { id: utilisateur.id } }
      )
    } else if (Authentification.estConseiller(utilisateur.type)) {
      await ConseillerSqlModel.update(
        {
          idAuthentification: utilisateur.idAuthentification,
          email: utilisateur.email,
          username: utilisateur.username,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          dateDerniereConnexion: utilisateur.dateDerniereConnexion,
          datePremiereConnexion: utilisateur.datePremiereConnexion
        },
        { where: { id: utilisateur.id } }
      )
    }
  }

  async save(
    utilisateur: Authentification.Utilisateur,
    dateCreation?: Date
  ): Promise<void> {
    if (Authentification.estConseiller(utilisateur.type)) {
      await ConseillerSqlModel.upsert({
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email ?? null,
        username: utilisateur.username ?? null,
        structure: utilisateur.structure,
        idAuthentification: utilisateur.idAuthentification,
        dateCreation: dateCreation ?? undefined,
        dateDerniereConnexion: utilisateur.dateDerniereConnexion
      })
    }
  }

  async updateJeune(
    utilisateur: Partial<Authentification.Utilisateur>
  ): Promise<void> {
    await JeuneSqlModel.update(
      {
        idAuthentification: utilisateur.idAuthentification
      },
      { where: { id: utilisateur.id } }
    )
  }

  async deleteUtilisateurIdp(idUserCEJ: string): Promise<void> {
    try {
      await this.oidcClient.deleteAccount(idUserCEJ)
    } catch (_e) {}
    this.logger.log(`Utilisateur ${idUserCEJ} supprimé de OIDC SSO`)
  }

  async estConseillerSuperviseur(
    structure: Core.Structure,
    email?: string | null
  ): Promise<boolean> {
    if (estMilo(structure)) return true
    if (!email) return false

    const superviseursParEmail = await SuperviseurSqlModel.findAll({
      where: { email: { [Op.like]: `${email.split('@')[0]}%` } }
    })

    return superviseursParEmail.length > 0
  }

  async recupererAccesPartenaire(
    bearer: string,
    structure: Core.Structure
  ): Promise<string> {
    return this.oidcClient.exchangeToken(bearer, structure)
  }

  async seFairePasserPourUnConseiller(
    idConseiller: string,
    bearer: string,
    structure: Core.Structure
  ): Promise<Result<string>> {
    const conseillerSqlModel = await ConseillerSqlModel.findByPk(idConseiller)
    if (!conseillerSqlModel)
      return failure(new NonTrouveError('Conseiller', idConseiller))

    try {
      const accesConseiller = await this.oidcClient.exchangeToken(
        bearer,
        structure,
        {
          sub: conseillerSqlModel.idAuthentification,
          type: Authentification.Type.CONSEILLER
        }
      )

      return success(accesConseiller)
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return failure(new ConseillerInactifError())
      }
      throw e
    }
  }
}
