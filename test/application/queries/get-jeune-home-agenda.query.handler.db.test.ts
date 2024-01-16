import { DateTime } from 'luxon'
import { ConseillerInterAgenceAuthorizer } from 'src/application/authorizers/conseiller-inter-agence-authorizer'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.handler.db'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { ActionQueryModel } from 'src/application/queries/query-models/actions.query-model'
import { JeuneHomeAgendaQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { RendezVousJeuneQueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import {
  emptySuccess,
  failure,
  isSuccess,
  Result,
  success
} from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Core } from 'src/domain/core'
import { SessionMilo } from 'src/domain/milo/session.milo'
import {
  ActionDto,
  ActionSqlModel
} from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from 'test/fixtures/authentification.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { uneActionQueryModelSansJeune } from 'test/fixtures/query-models/action.query-model.fixtures'
import { unRendezVousQueryModel } from 'test/fixtures/query-models/rendez-vous.query-model.fixtures'
import { uneSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from 'test/fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { testConfig } from 'test/utils/module-for-testing'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'

describe('GetJeuneHomeAgendaQueryHandler', () => {
  const utilisateurJeune = unUtilisateurJeune()
  const utilisateurConseiller = unUtilisateurConseiller()
  const idJeune = utilisateurJeune.id
  let handler: GetJeuneHomeAgendaQueryHandler
  let sessionsQueryGetter: StubbedClass<GetSessionsJeuneMiloQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  const aujourdhuiDimanche = '2022-08-14T12:00:00Z'
  const demain = new Date('2022-08-15T12:00:00Z')
  const apresDemain = new Date('2022-08-16T12:00:00Z')
  const jeuneDto = unJeuneDto({ idPartenaire: 'idDossier' })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sessionsQueryGetter = stubClass(GetSessionsJeuneMiloQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    handler = new GetJeuneHomeAgendaQueryHandler(
      jeuneAuthorizer,
      sessionsQueryGetter,
      conseillerAgenceAuthorizer,
      testConfig()
    )
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(jeuneDto)
  })

  describe('handle', () => {
    const accessToken = 'token'
    const homeQuery = {
      idJeune,
      maintenant: aujourdhuiDimanche,
      accessToken: accessToken,
      structure: Core.Structure.MILO
    }
    const lundiDernierString = '2022-08-08T00:00:00Z'
    const dimancheEnHuitString = '2022-08-21T23:59:59.999Z'
    beforeEach(async () => {
      sessionsQueryGetter.handle
        .withArgs(idJeune, 'idDossier', accessToken, {
          periode: {
            debut: DateTime.fromISO(lundiDernierString, { setZone: true }),
            fin: DateTime.fromISO(dimancheEnHuitString, { setZone: true })
          },
          pourConseiller: false,
          filtrerEstInscrit: true
        })
        .resolves(success([]))
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie une failure ', async () => {
        // Given
        await JeuneSqlModel.destroy({ where: { id: jeuneDto.id } })

        // When
        const result = await handler.handle(homeQuery, utilisateurJeune)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', homeQuery.idJeune))
        )
      })
    })

    describe('quand le jeune existe sans ID partenaire', () => {
      it('renvoie une failure ', async () => {
        // Given
        await JeuneSqlModel.update(
          {
            idPartenaire: null
          },
          { where: { id: jeuneDto.id } }
        )

        // When
        const result = await handler.handle(homeQuery, utilisateurJeune)

        // Then
        expect(result).to.deep.equal(
          failure(new JeuneMiloSansIdDossier(homeQuery.idJeune))
        )
      })
    })

    it("doit retourner les événements bornés entre lundi dernier minuit et lundi en huit minuit, d'après la locale utilisateur", async () => {
      // Given
      const aujourdhuiMercredi = '2022-08-17T00:00:00-07:00'
      const _lundiDernier = '2022-08-15T00:00:00-07:00'
      const _dimancheEnHuit = '2022-08-29T00:00:00-07:00'
      const [_dimancheDernier, lundiDernier, dimancheEnHuit, _lundiEnHuit] =
        await createActions([
          '2022-08-14T23:59:00-07:00',
          '2022-08-15T00:00:00-07:00',
          '2022-08-28T23:59:00-07:00',
          '2022-08-29T00:00:00-07:00'
        ])
      sessionsQueryGetter.handle
        .withArgs(idJeune, 'idDossier', accessToken, {
          periode: {
            debut: DateTime.fromISO(_lundiDernier, { setZone: true }),
            fin: DateTime.fromISO(_dimancheEnHuit, { setZone: true })
          },
          pourConseiller: false,
          filtrerEstInscrit: true
        })
        .resolves(success([]))

      // When
      const result = await handler.handle(
        {
          idJeune: idJeune,
          maintenant: aujourdhuiMercredi,
          accessToken: accessToken
        },
        utilisateurJeune
      )

      // Then
      const expected: JeuneHomeAgendaQueryModel = {
        actions: [
          uneActionQueryModelSansJeune({
            id: lundiDernier.id,
            dateEcheance: DateTime.fromJSDate(lundiDernier.dateEcheance).toISO()
          }),
          uneActionQueryModelSansJeune({
            id: dimancheEnHuit.id,
            dateEcheance: DateTime.fromJSDate(
              dimancheEnHuit.dateEcheance
            ).toISO()
          })
        ],
        rendezVous: [],
        sessionsMilo: [],
        metadata: {
          actionsEnRetard: 2,
          dateDeDebut: lundiDernier.dateEcheance,
          dateDeFin: new Date('2022-08-29T06:59:59.999Z')
        }
      }
      expect(result).to.deep.equal(success(expected))
    })

    describe('actions', () => {
      let demain: AsSql<ActionDto>
      let apresDemain: AsSql<ActionDto>
      let result: Result<JeuneHomeAgendaQueryModel>

      beforeEach(async () => {
        ;[demain, apresDemain] = await createActions([
          '2022-08-13T12:00:00Z',
          '2022-08-14T12:00:00Z'
        ])

        // When
        result = await handler.handle(homeQuery, utilisateurJeune)
      })
      it('renvoie les actions triées par date', async () => {
        // Then
        const actionsQM: ActionQueryModel[] = [
          uneActionQueryModelSansJeune({
            id: demain.id,
            dateEcheance: DateTime.fromJSDate(demain.dateEcheance).toISO()
          }),
          uneActionQueryModelSansJeune({
            id: apresDemain.id,
            dateEcheance: DateTime.fromJSDate(apresDemain.dateEcheance).toISO()
          })
        ]
        expect(isSuccess(result) && result.data.actions).to.deep.equal(
          actionsQM
        )
      })
    })

    describe('rendez-vous', () => {
      it('renvoie les rendez-vous triés par date', async () => {
        // Given
        const unRendezVousDtoPourDemain = unRendezVousDto({
          date: demain
        })
        const unRendezVousDtoPourApresDemain = unRendezVousDto({
          date: apresDemain
        })

        await RendezVousSqlModel.bulkCreate([
          unRendezVousDtoPourDemain,
          unRendezVousDtoPourApresDemain
        ])
        await RendezVousJeuneAssociationSqlModel.bulkCreate([
          { idJeune: jeuneDto.id, idRendezVous: unRendezVousDtoPourDemain.id },
          {
            idJeune: jeuneDto.id,
            idRendezVous: unRendezVousDtoPourApresDemain.id
          }
        ])

        // When
        const result = await handler.handle(homeQuery, utilisateurJeune)

        // Then
        const expected: RendezVousJeuneQueryModel[] = [
          unRendezVousQueryModel({
            id: unRendezVousDtoPourDemain.id,
            date: unRendezVousDtoPourDemain.date
          }),
          unRendezVousQueryModel({
            id: unRendezVousDtoPourApresDemain.id,
            date: unRendezVousDtoPourApresDemain.date
          })
        ]
        expect(isSuccess(result) && result.data.rendezVous).to.deep.equal(
          expected
        )
      })
    })

    describe('sessionsMilo', () => {
      it('renvoie un tableau vide si le jeune n’est inscrit à aucune session sur la période', async () => {
        // Given
        sessionsQueryGetter.handle
          .withArgs(idJeune, 'idDossier', accessToken, {
            periode: {
              debut: DateTime.fromISO(lundiDernierString, { setZone: true }),
              fin: DateTime.fromISO(dimancheEnHuitString, { setZone: true })
            }
          })
          .resolves(success([]))

        // When
        const result = await handler.handle(homeQuery, utilisateurJeune)

        // Then
        expect(isSuccess(result) && result.data.sessionsMilo).to.be.empty()
      })

      it('renvoie au jeune les sessions Milo triées par date si le jeune est inscrit à des sessions sur la période', async () => {
        // Given
        const sessionAvecInscriptionAJPlus1 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: DateTime.fromJSDate(demain)
            .plus({ days: 1 })
            .toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })

        const sessionAvecInscriptionAJPlus2 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: DateTime.fromJSDate(demain)
            .plus({ days: 2 })
            .toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })
        sessionsQueryGetter.handle
          .withArgs(idJeune, 'idDossier', accessToken, {
            periode: {
              debut: DateTime.fromISO(lundiDernierString, { setZone: true }),
              fin: DateTime.fromISO(dimancheEnHuitString, { setZone: true })
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

        // When
        const result = await handler.handle(homeQuery, utilisateurJeune)

        // Then
        expect(isSuccess(result) && result.data.sessionsMilo).to.be.deep.equal([
          sessionAvecInscriptionAJPlus1,
          sessionAvecInscriptionAJPlus2
        ])
      })

      it('renvoie au conseiller les sessions Milo triées par date si le jeune est inscrit à des sessions sur la période', async () => {
        // Given
        const sessionAvecInscriptionAJPlus1 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: DateTime.fromJSDate(demain)
            .plus({ days: 1 })
            .toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })
        const sessionAvecInscriptionAJPlus2 = uneSessionJeuneMiloQueryModel({
          dateHeureDebut: DateTime.fromJSDate(demain)
            .plus({ days: 2 })
            .toISODate(),
          inscription: SessionMilo.Inscription.Statut.INSCRIT
        })
        sessionsQueryGetter.handle
          .withArgs(idJeune, 'idDossier', accessToken, {
            periode: {
              debut: DateTime.fromISO(lundiDernierString, { setZone: true }),
              fin: DateTime.fromISO(dimancheEnHuitString, { setZone: true })
            },
            pourConseiller: true,
            filtrerEstInscrit: true
          })
          .resolves(
            success([
              sessionAvecInscriptionAJPlus1,
              sessionAvecInscriptionAJPlus2
            ])
          )

        // When
        const result = await handler.handle(homeQuery, utilisateurConseiller)

        // Then
        expect(isSuccess(result) && result.data.sessionsMilo).to.be.deep.equal([
          sessionAvecInscriptionAJPlus1,
          sessionAvecInscriptionAJPlus2
        ])
      })
    })

    describe('metadata', () => {
      let result: Result<JeuneHomeAgendaQueryModel>

      beforeEach(async () => {
        const hier = '2022-08-13T12:00:00Z'
        const aujourdhui = '2022-08-14T08:30:00Z'
        const dansUneSemaine = '2022-08-21T12:00:00Z'
        await createActions([hier], Action.Statut.TERMINEE)
        await createActions([hier], Action.Statut.ANNULEE)
        await createActions(
          [hier, aujourdhui, dansUneSemaine],
          Action.Statut.PAS_COMMENCEE
        )

        // When
        result = await handler.handle(homeQuery, utilisateurJeune)
      })
      it("retourne le compte d'actions en retard et les dates", async () => {
        // Then
        expect(result._isSuccess && result.data.metadata).to.deep.equal({
          actionsEnRetard: 1,
          dateDeDebut: new Date('2022-08-08T00:00:00.000Z'),
          dateDeFin: new Date('2022-08-21T23:59:59.999Z')
        })
      })
    })
  })

  describe('authorize', () => {
    const jeune = unJeune()
    const query = {
      idJeune: jeune.id,
      maintenant: aujourdhuiDimanche,
      accessToken: 'token',
      structure: Core.Structure.MILO
    }

    describe('quand c’est un jeune', () => {
      it('appelle l’authorizer idoine', async () => {
        // Given
        jeuneAuthorizer.autoriserLeJeune
          .withArgs(jeune.id, unUtilisateurJeune({ id: jeune.id }))
          .resolves(emptySuccess())

        // When
        const result = await handler.authorize(query, unUtilisateurJeune())

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand c’est un conseiller', () => {
      it('appelle l’authorizer idoine', async () => {
        // Given
        const jeune = unJeune()
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })

        // When
        await handler.authorize(query, utilisateur)

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
        ).to.have.been.calledWithExactly(jeune.id, utilisateur)
      })
    })
  })
})

async function createActions(
  dates: string[],
  statut?: Action.Statut
): Promise<Array<AsSql<ActionDto>>> {
  const dtos = dates.map(date => {
    return uneActionDto({
      dateEcheance: DateTime.fromISO(date).toJSDate(),
      statut: statut ?? Action.Statut.PAS_COMMENCEE
    })
  })
  await ActionSqlModel.bulkCreate(dtos)
  return dtos
}
