import { describe } from 'mocha'
import { expect, StubbedClass, stubClass } from '../../utils'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import {
  GetJeuneHomeAgendaPoleEmploiQuery,
  GetJeuneHomeAgendaPoleEmploiQueryHandler
} from '../../../src/application/queries/get-jeune-home-agenda-pole-emploi.query.handler'
import {
  failure,
  isSuccess,
  Result,
  success
} from '../../../src/building-blocks/types/result'
import { DateTime } from 'luxon'
import { JeuneHomeAgendaPoleEmploiQueryModel } from '../../../src/application/queries/query-models/home-jeune-suivi.query-model'
import { unRendezVousQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'

describe('GetJeuneHomeAgendaPoleEmploiQueryHandler', () => {
  let handler: GetJeuneHomeAgendaPoleEmploiQueryHandler
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getRendezVousJeunePoleEmploiQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>

  beforeEach(() => {
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getRendezVousJeunePoleEmploiQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)

    handler = new GetJeuneHomeAgendaPoleEmploiQueryHandler(
      getDemarchesQueryGetter,
      getRendezVousJeunePoleEmploiQueryGetter,
      jeunePoleEmploiAuthorizer
    )
  })

  describe('handle', () => {
    const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')
    const dansDeuxSemaines = DateTime.fromISO('2020-04-20T12:00:00.000Z')
    const uneDemarcheDeLaSemaineDerniere = uneDemarcheQueryModel({
      dateFin: maintenant.minus({ weeks: 1 }).toISO()
    })
    const uneDemarcheDeLaSemaine = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ day: 1 }).toISO()
    })
    const uneDemarcheDeLaSemaineProchaine = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ weeks: 1 }).toISO()
    })
    const uneDemarcheDansDeuxSemainesPlusUnJour = uneDemarcheQueryModel({
      dateFin: maintenant.plus({ weeks: 2, day: 1 }).toISO()
    })

    const unRendezVousHier = unRendezVousQueryModel({
      date: maintenant.minus({ day: 1 }).toJSDate()
    })

    const unRendezVousAujourdhui = unRendezVousQueryModel({
      date: maintenant.toJSDate()
    })

    const unRendezVousDansDeuxSemainesPlusUnJour = unRendezVousQueryModel({
      date: maintenant.plus({ weeks: 2, day: 1 }).toJSDate()
    })

    let result: Result<JeuneHomeAgendaPoleEmploiQueryModel>

    describe('quand les services externes répondent avec Succès', () => {
      beforeEach(async () => {
        // Given
        const query: GetJeuneHomeAgendaPoleEmploiQuery = {
          idJeune: 'idJeune',
          maintenant: maintenant.toString(),
          accessToken: 'accessToken'
        }

        getDemarchesQueryGetter.handle
          .withArgs({ ...query, tri: GetDemarchesQueryGetter.Tri.parDateFin })
          .resolves(
            success([
              uneDemarcheDansDeuxSemainesPlusUnJour,
              uneDemarcheDeLaSemaine,
              uneDemarcheDeLaSemaineProchaine,
              uneDemarcheDeLaSemaineDerniere
            ])
          )

        getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
          success([
            unRendezVousHier,
            unRendezVousAujourdhui,
            unRendezVousDansDeuxSemainesPlusUnJour
          ])
        )

        // When
        result = await handler.handle(query)
      })
      it('retourne des démarches filtrées entre maintenant et dans deux semaines', () => {
        // Then
        expect(isSuccess(result) && result.data.demarches).to.deep.equal([
          uneDemarcheDeLaSemaine,
          uneDemarcheDeLaSemaineProchaine
        ])
      })

      it('retourne des rendez vous filtrées entre maintenant et dans deux semaines', () => {
        // Then
        expect(isSuccess(result) && result.data.rendezVous).to.deep.equal([
          unRendezVousAujourdhui
        ])
      })

      it('retourne des metadata', () => {
        // Then
        expect(isSuccess(result) && result.data.metadata).to.deep.equal({
          dateDeDebut: maintenant.toJSDate(),
          dateDeFin: dansDeuxSemaines.toJSDate(),
          demarchesEnRetard: 1
        })
      })
    })

    describe('quand les démarches sont en échec', () => {
      it("retourne l'échec", async () => {
        // Given
        const query: GetJeuneHomeAgendaPoleEmploiQuery = {
          idJeune: 'idJeune',
          maintenant: maintenant.toString(),
          accessToken: 'accessToken'
        }

        getDemarchesQueryGetter.handle.resolves(
          failure(new ErreurHttp('Erreur', 500))
        )

        // When
        result = await handler.handle(query)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('Erreur', 500)))
      })
    })

    describe('quand les rendez vous sont en échec', () => {
      it("retourne l'échec", async () => {
        // Given
        const query: GetJeuneHomeAgendaPoleEmploiQuery = {
          idJeune: 'idJeune',
          maintenant: maintenant.toString(),
          accessToken: 'accessToken'
        }

        getDemarchesQueryGetter.handle.resolves(success([]))
        getRendezVousJeunePoleEmploiQueryGetter.handle.resolves(
          failure(new ErreurHttp('Erreur', 418))
        )

        // When
        result = await handler.handle(query)

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('Erreur', 418)))
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune PE', () => {
      // Given
      const query: GetJeuneHomeAgendaPoleEmploiQuery = {
        idJeune: 'idJeune',
        maintenant: DateTime.now().toString(),
        accessToken: 'accessToken'
      }

      // When
      handler.authorize(query, unUtilisateurJeune())

      // Then
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly(query.idJeune, unUtilisateurJeune())
    })
  })
})
