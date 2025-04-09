import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { isSuccess } from 'src/building-blocks/types/result'
import {
  ActionDto,
  ActionSqlModel
} from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import {
  GetActionsJeuneQuery,
  GetActionsJeuneQueryHandler
} from '../../../../src/application/queries/action/get-actions-jeune.query.handler.db'
import {
  ActionQueryModel,
  QualificationActionQueryModel
} from '../../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../../src/domain/action/action'
import { Core } from '../../../../src/domain/core'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetActionsByJeuneQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getActionsByJeuneQueryHandler: GetActionsJeuneQueryHandler
  let sandbox: SinonSandbox

  const maintenant = DateTime.now()
  const debutPeriode = maintenant.minus({ day: 3 })
  const finPeriode = maintenant.plus({ day: 3 })
  const tropTot = debutPeriode.minus({ day: 1 }).toJSDate()
  const tropTard = finPeriode.plus({ day: 1 }).toJSDate()
  const pendantPeriode = debutPeriode.plus({ day: 1 }).toJSDate()

  before(() => {
    databaseForTesting = getDatabase()
    sandbox = createSandbox()
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    getActionsByJeuneQueryHandler = new GetActionsJeuneQueryHandler(
      conseillerAgenceAuthorizer
    )
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const conseillerDto = unConseillerDto()
    const jeuneDto = unJeuneDto()

    beforeEach(async () => {
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(jeuneDto)
    })

    it('retourne un tableau vide et 0 résultat', async () => {
      const result = await getActionsByJeuneQueryHandler.handle({
        idJeune: jeuneDto.id,
        dateDebut: debutPeriode,
        dateFin: finPeriode
      })

      // Then
      expect(isSuccess(result)).to.be.true()
      if (isSuccess(result)) {
        expect(result.data).to.be.empty()
      }
    })

    it('renvoie les actions terminées pendant la période', async () => {
      // Given
      const actionTermineeTropTot = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.TERMINEE,
        dateFinReelle: tropTot
      })
      const actionTermineeTropTard = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.TERMINEE,
        dateFinReelle: tropTard
      })
      const actionTermineePendantPeriode = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.TERMINEE,
        dateFinReelle: pendantPeriode
      })
      await ActionSqlModel.bulkCreate([
        actionTermineeTropTot,
        actionTermineeTropTard,
        actionTermineePendantPeriode
      ])

      // When
      const result = await getActionsByJeuneQueryHandler.handle({
        idJeune: jeuneDto.id,
        dateDebut: debutPeriode,
        dateFin: finPeriode
      })

      // Then
      expect(isSuccess(result)).to.be.true()
      if (isSuccess(result)) {
        expect(result.data).to.be.deep.equal([
          fromDtoToQueryModel(
            actionTermineePendantPeriode,
            jeuneDto,
            Action.Qualification.Etat.A_QUALIFIER
          )
        ])
      }
    })

    it('renvoie les actions non terminées commencées pendant la période', async () => {
      // Given
      const actionCommenceeTropTot = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.EN_COURS,
        dateDebut: tropTot
      })
      const actionCommenceeTropTard = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.EN_COURS,
        dateDebut: tropTard
      })
      const actionCommenceePendantPeriode = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.EN_COURS,
        dateDebut: pendantPeriode
      })
      const actionTerminee = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.TERMINEE,
        dateDebut: pendantPeriode,
        dateFinReelle: tropTard
      })
      await ActionSqlModel.bulkCreate([
        actionCommenceeTropTot,
        actionCommenceeTropTard,
        actionCommenceePendantPeriode,
        actionTerminee
      ])

      // When
      const result = await getActionsByJeuneQueryHandler.handle({
        idJeune: jeuneDto.id,
        dateDebut: debutPeriode,
        dateFin: finPeriode
      })

      // Then
      expect(isSuccess(result)).to.be.true()
      if (isSuccess(result)) {
        expect(result.data).to.be.deep.equal([
          fromDtoToQueryModel(actionCommenceePendantPeriode, jeuneDto)
        ])
      }
    })

    it('renvoie les actions non terminées, non commencées, prévues pendant la période', async () => {
      // Given
      const actionPrevueTropTot = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.PAS_COMMENCEE,
        dateEcheance: tropTot
      })
      const actionPrevueTropTard = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.PAS_COMMENCEE,
        dateEcheance: tropTard
      })
      const actionPrevuePendantPeriode = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.PAS_COMMENCEE,
        dateEcheance: pendantPeriode
      })
      const actionCommencee = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.EN_COURS,
        dateEcheance: pendantPeriode,
        dateDebut: tropTard
      })
      const actionTerminee = uneActionDto({
        idJeune: jeuneDto.id,
        statut: Action.Statut.EN_COURS,
        dateEcheance: pendantPeriode,
        dateFinReelle: tropTard
      })
      await ActionSqlModel.bulkCreate([
        actionPrevueTropTot,
        actionPrevueTropTard,
        actionPrevuePendantPeriode,
        actionCommencee,
        actionTerminee
      ])

      // When
      const result = await getActionsByJeuneQueryHandler.handle({
        idJeune: jeuneDto.id,
        dateDebut: debutPeriode,
        dateFin: finPeriode
      })

      // Then
      expect(isSuccess(result)).to.be.true()
      if (isSuccess(result)) {
        expect(result.data).to.be.deep.equal([
          fromDtoToQueryModel(actionPrevuePendantPeriode, jeuneDto)
        ])
      }
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      const query: GetActionsJeuneQuery = {
        idJeune: 'id-jeune',
        dateDebut: debutPeriode,
        dateFin: finPeriode
      }

      // When
      await getActionsByJeuneQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
      ).to.have.been.calledWithExactly('id-jeune', utilisateur)
    })
  })
})

function fromDtoToQueryModel(
  actionDto: AsSql<ActionDto>,
  jeuneDto: AsSql<JeuneDto>,
  etat: Action.Qualification.Etat = Action.Qualification.Etat.NON_QUALIFIABLE,
  qualification?: QualificationActionQueryModel
): ActionQueryModel {
  return {
    id: actionDto.id,
    content: actionDto.contenu,
    comment: actionDto.description,
    status: actionDto.statut,
    creationDate: DateTime.fromJSDate(actionDto.dateCreation).toFormat(
      'EEE, d MMM yyyy HH:mm:ss z'
    ),
    lastUpdate: DateTime.fromJSDate(
      actionDto.dateDerniereActualisation
    ).toFormat('EEE, d MMM yyyy HH:mm:ss z'),
    creator: 'Nils Tavernier',
    creatorType: Action.TypeCreateur.CONSEILLER,
    dateEcheance: DateTime.fromJSDate(actionDto.dateEcheance).toISO(),
    dateFinReelle: actionDto.dateFinReelle
      ? DateTime.fromJSDate(actionDto.dateFinReelle).toISO()
      : undefined,
    jeune: {
      id: jeuneDto.id,
      lastName: jeuneDto.nom,
      firstName: jeuneDto.prenom,
      idConseiller: jeuneDto.idConseiller!,
      dispositif: jeuneDto.dispositif
    },
    etat,
    qualification
  }
}
