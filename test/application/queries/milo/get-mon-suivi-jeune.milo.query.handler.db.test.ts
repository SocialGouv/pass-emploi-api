import { unJeune } from '../../../fixtures/jeune.fixture'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import {
  emptySuccess,
  failure,
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  GetMonSuiviMiloQuery,
  GetMonSuiviMiloQueryHandler
} from '../../../../src/application/queries/milo/get-mon-suivi-jeune.milo.query.handler.db'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import { getDatabase } from '../../../utils/database-for-testing'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import {
  ErreurHttp,
  JeuneMiloSansIdDossier,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { Action } from '../../../../src/domain/action/action'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import {
  ActionDto,
  ActionSqlModel
} from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import { DateTime } from 'luxon'
import { ActionQueryModel } from '../../../../src/application/queries/query-models/actions.query-model'
import { uneActionQueryModel } from '../../../fixtures/query-models/action.query-model.fixtures'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousJeuneQueryModel } from '../../../../src/application/queries/query-models/rendez-vous.query-model'
import { unRendezVousQueryModel } from '../../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { uneSessionJeuneMiloQueryModel } from '../../../fixtures/sessions.fixture'
import { GetSessionsJeuneMiloQueryGetter } from '../../../../src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'
import { GetMonSuiviMiloQueryModel } from '../../../../src/application/queries/query-models/jeunes.milo.query-model'
import { SessionJeuneMiloQueryModel } from '../../../../src/application/queries/query-models/sessions.milo.query.model'
import { UnauthorizedException } from '@nestjs/common'

describe('GetMonSuiviMiloQueryHandler', () => {
  let handler: GetMonSuiviMiloQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let sessionsQueryGetter: StubbedClass<GetSessionsJeuneMiloQueryGetter>

  const dateDebut = DateTime.fromISO('2024-01-14T12:00:00Z', { setZone: true })
  const dateFin = DateTime.fromISO('2024-02-14T12:00:00Z', { setZone: true })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    sessionsQueryGetter = stubClass(GetSessionsJeuneMiloQueryGetter)
    handler = new GetMonSuiviMiloQueryHandler(
      jeuneAuthorizer,
      sessionsQueryGetter
    )
  })

  describe('handle', () => {
    const utilisateurJeune = unUtilisateurJeune()
    const jeuneDto = unJeuneDto({ idPartenaire: 'idDossier' })

    const query: GetMonSuiviMiloQuery = {
      idJeune: jeuneDto.id,
      dateDebut,
      dateFin,
      accessToken: 'token'
    }

    beforeEach(async () => {
      await ConseillerSqlModel.creer(unConseillerDto())
      await JeuneSqlModel.creer(jeuneDto)
    })

    describe('quand le jeune n’existe pas', () => {
      it('renvoie une failure NonTrouve', async () => {
        // Given
        await JeuneSqlModel.destroy({ where: { id: jeuneDto.id } })

        // When
        const result = await handler.handle(query, utilisateurJeune)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', query.idJeune))
        )
      })
    })

    describe('quand le jeune existe', () => {
      describe('sans id partenaire', () => {
        it('renvoie une failure JeuneMiloSansIdDossier', async () => {
          // Given
          await JeuneSqlModel.update(
            {
              idPartenaire: null
            },
            { where: { id: jeuneDto.id } }
          )

          // When
          const result = await handler.handle(query, utilisateurJeune)

          // Then
          expect(result).to.deep.equal(
            failure(new JeuneMiloSansIdDossier(query.idJeune))
          )
        })
      })
      describe('avec id partenaire', () => {
        let result: Result<GetMonSuiviMiloQueryModel>
        let _actionAvantDateDebut1Heure: AsSql<ActionDto>
        let actionApresDateDebutUneHeure: AsSql<ActionDto>
        let actionApresDateDebutUnJour: AsSql<ActionDto>
        let actionAvantDateFinUnJour: AsSql<ActionDto>
        let actionAvantDateFinUneHeure: AsSql<ActionDto>
        let _actionApresDateFinUneHeure: AsSql<ActionDto>

        let _rendezVousAvantDateDebut1Heure: AsSql<RendezVousDto>
        let rendezVousApresDateDebutUneHeure: AsSql<RendezVousDto>
        let rendezVousApresDateDebutUnJour: AsSql<RendezVousDto>
        let rendezVousAvantDateFinUnJour: AsSql<RendezVousDto>
        let rendezVousAvantDateFinUneHeure: AsSql<RendezVousDto>
        let _rendezVousApresDateFinUneHeure: AsSql<RendezVousDto>

        let sessionAvecInscriptionAJPlus1: SessionJeuneMiloQueryModel
        let sessionAvecInscriptionAJPlus2: SessionJeuneMiloQueryModel

        beforeEach(async () => {
          // Given
          ;[
            _actionAvantDateDebut1Heure,
            actionApresDateDebutUneHeure,
            actionApresDateDebutUnJour,
            actionAvantDateFinUnJour,
            actionAvantDateFinUneHeure,
            _actionApresDateFinUneHeure
          ] = await createActions([
            dateDebut.minus({ hours: 1 }),
            dateDebut.plus({ hours: 1 }),
            dateDebut.plus({ days: 1 }),
            dateFin.minus({ days: 1 }),
            dateFin.minus({ hours: 1 }),
            dateFin.plus({ hours: 1 })
          ])
          ;[
            _rendezVousAvantDateDebut1Heure,
            rendezVousApresDateDebutUneHeure,
            rendezVousApresDateDebutUnJour,
            rendezVousAvantDateFinUnJour,
            rendezVousAvantDateFinUneHeure,
            _rendezVousApresDateFinUneHeure
          ] = await createRendezVous(
            [
              dateDebut.minus({ hours: 1 }),
              dateDebut.plus({ hours: 1 }),
              dateDebut.plus({ days: 1 }),
              dateFin.minus({ days: 1 }),
              dateFin.minus({ hours: 1 }),
              dateFin.plus({ hours: 1 })
            ],
            jeuneDto.id
          )

          sessionAvecInscriptionAJPlus1 = uneSessionJeuneMiloQueryModel({
            dateHeureDebut: dateDebut.plus({ days: 1 }).toISODate(),
            inscription: SessionMilo.Inscription.Statut.INSCRIT
          })
          sessionAvecInscriptionAJPlus2 = uneSessionJeuneMiloQueryModel({
            dateHeureDebut: dateDebut.plus({ days: 2 }).toISODate(),
            inscription: SessionMilo.Inscription.Statut.INSCRIT
          })

          sessionsQueryGetter.handle
            .withArgs(jeuneDto.id, jeuneDto.idPartenaire!, query.accessToken, {
              periode: {
                debut: dateDebut,
                fin: dateFin
              },
              pourConseiller: false,
              filtrerEstInscrit: true
            })
            .resolves(
              success([
                sessionAvecInscriptionAJPlus1,
                sessionAvecInscriptionAJPlus2
              ])
            )
          result = await handler.handle(query, utilisateurJeune)
        })
        it('renvoie les actions triées par date', async () => {
          // Then
          const actionsQueryModel: ActionQueryModel[] = [
            uneActionQueryModel({
              id: actionApresDateDebutUneHeure.id,
              dateEcheance: DateTime.fromJSDate(
                actionApresDateDebutUneHeure.dateEcheance
              ).toISO()
            }),
            uneActionQueryModel({
              id: actionApresDateDebutUnJour.id,
              dateEcheance: DateTime.fromJSDate(
                actionApresDateDebutUnJour.dateEcheance
              ).toISO()
            }),
            uneActionQueryModel({
              id: actionAvantDateFinUnJour.id,
              dateEcheance: DateTime.fromJSDate(
                actionAvantDateFinUnJour.dateEcheance
              ).toISO()
            }),
            uneActionQueryModel({
              id: actionAvantDateFinUneHeure.id,
              dateEcheance: DateTime.fromJSDate(
                actionAvantDateFinUneHeure.dateEcheance
              ).toISO()
            })
          ]
          expect(isSuccess(result) && result.data.actions).to.deep.equal(
            actionsQueryModel
          )
        })
        it('renvoie les rendez-vous triés par date', async () => {
          // Then
          const rendezVousJeuneQueryModel: RendezVousJeuneQueryModel[] = [
            unRendezVousQueryModel({
              id: rendezVousApresDateDebutUneHeure.id,
              date: rendezVousApresDateDebutUneHeure.date
            }),
            unRendezVousQueryModel({
              id: rendezVousApresDateDebutUnJour.id,
              date: rendezVousApresDateDebutUnJour.date
            }),
            unRendezVousQueryModel({
              id: rendezVousAvantDateFinUnJour.id,
              date: rendezVousAvantDateFinUnJour.date
            }),
            unRendezVousQueryModel({
              id: rendezVousAvantDateFinUneHeure.id,
              date: rendezVousAvantDateFinUneHeure.date
            })
          ]
          expect(isSuccess(result) && result.data.rendezVous).to.deep.equal(
            rendezVousJeuneQueryModel
          )
        })
        it('renvoie les sessions milo triées par date', async () => {
          // When
          const result = await handler.handle(query, utilisateurJeune)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data.sessionsMilo).to.be.deep.equal([
              sessionAvecInscriptionAJPlus1,
              sessionAvecInscriptionAJPlus2
            ])
          }
        })
      })
    })

    describe('quand la récupération des sessions échoue', () => {
      let result: Result<GetMonSuiviMiloQueryModel>

      beforeEach(async () => {
        // Given
        sessionsQueryGetter.handle
          .withArgs(jeuneDto.id, jeuneDto.idPartenaire!, query.accessToken, {
            periode: {
              debut: dateDebut,
              fin: dateFin
            },
            pourConseiller: false,
            filtrerEstInscrit: true
          })
          .resolves(failure(new ErreurHttp('Ressource Milo introuvable', 404)))
        // When
        result = await handler.handle(query, utilisateurJeune)
      })
      it('renvoie null en cas d’impossibilité de récupérer les sessions du bénéficiaire', async () => {
        // Then
        expect(isSuccess(result) && result.data).to.deep.equal({
          actions: [],
          rendezVous: [],
          sessionsMilo: null
        })
      })
    })

    describe('quand la récupération des sessions échoue en UnauthorizedException', () => {
      it("renvoie l'erreur", async () => {
        // Given
        sessionsQueryGetter.handle
          .withArgs(jeuneDto.id, jeuneDto.idPartenaire!, query.accessToken, {
            periode: {
              debut: dateDebut,
              fin: dateFin
            },
            pourConseiller: false,
            filtrerEstInscrit: true
          })
          .throws(
            new UnauthorizedException({
              statusCode: 401,
              code: 'Unauthorized',
              message: 'token exchange jeune failed'
            })
          )
        // When
        try {
          await handler.handle(query, utilisateurJeune)
          expect.fail(null, null, 'handle test did not reject with an error')
        } catch (e) {
          expect(e).to.deep.equal(
            new UnauthorizedException({
              statusCode: 401,
              code: 'Unauthorized',
              message: 'token exchange jeune failed'
            })
          )
        }
      })
    })
  })

  describe('authorize', () => {
    const jeune = unJeune()
    const query: GetMonSuiviMiloQuery = {
      idJeune: jeune.id,
      dateDebut,
      dateFin,
      accessToken: 'token'
    }

    it('appelle l’authorizer idoine', async () => {
      // Given
      jeuneAuthorizer.autoriserLeJeune.resolves(emptySuccess())

      // When
      const result = await handler.authorize(query, unUtilisateurJeune())

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly(
        jeune.id,
        unUtilisateurJeune({ id: jeune.id }),
        true
      )
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})

async function createActions(
  dates: DateTime[],
  statut?: Action.Statut
): Promise<Array<AsSql<ActionDto>>> {
  const dtos = dates.map(date => {
    return uneActionDto({
      dateEcheance: date.toJSDate(),
      statut: statut ?? Action.Statut.PAS_COMMENCEE
    })
  })
  await ActionSqlModel.bulkCreate(dtos)
  return dtos
}

async function createRendezVous(
  dates: DateTime[],
  idJeune: string
): Promise<Array<AsSql<RendezVousDto>>> {
  const rendezVousDtos = dates.map(date => {
    return unRendezVousDto({
      date: date.toJSDate()
    })
  })
  const associationDtos = rendezVousDtos.map(rdv => {
    return { idJeune, idRendezVous: rdv.id }
  })
  await RendezVousSqlModel.bulkCreate(rendezVousDtos)
  await RendezVousJeuneAssociationSqlModel.bulkCreate(associationDtos)
  return rendezVousDtos
}
