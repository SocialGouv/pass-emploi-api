import { HttpStatus, INestApplication } from '@nestjs/common'
import {
  GetActionsConseillerV2Query,
  GetActionsConseillerV2QueryHandler,
  TriActionsConseillerV2
} from 'src/application/queries/action/get-actions-conseiller-v2.query.handler.db'
import { GetRendezVousConseillerPaginesQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { success } from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'

describe('ConseillersControllerV2', () => {
  let app: INestApplication
  let getRendezVousConseillerPaginesQueryHandler: StubbedClass<GetRendezVousConseillerPaginesQueryHandler>
  let getActionsConseillerQueryHandler: StubbedClass<GetActionsConseillerV2QueryHandler>

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getRendezVousConseillerPaginesQueryHandler = app.get(
      GetRendezVousConseillerPaginesQueryHandler
    )
    getActionsConseillerQueryHandler = app.get(
      GetActionsConseillerV2QueryHandler
    )
  })

  describe('GET /v2/conseillers/:idConseiller/rendezvous', () => {
    const dateString = '2020-10-10'
    const dateStringPlusRecente = '2022-10-10'

    it('renvoie 206 quand aucun parametre envoyé', async () => {
      // Given
      getRendezVousConseillerPaginesQueryHandler.execute.resolves(success([]))

      // When - Then
      await request(app.getHttpServer())
        .get(`/v2/conseillers/41/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.PARTIAL_CONTENT)

      expect(
        getRendezVousConseillerPaginesQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller: '41',
          tri: undefined,
          dateDebut: undefined,
          dateFin: undefined,
          presenceConseiller: undefined
        },
        unUtilisateurDecode()
      )
    })
    it('renvoie 206 quand dateDebut seulement', async () => {
      // Given
      getRendezVousConseillerPaginesQueryHandler.execute.resolves(success([]))

      // When - Then
      await request(app.getHttpServer())
        .get(`/v2/conseillers/41/rendezvous?dateDebut=${dateString}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.PARTIAL_CONTENT)

      expect(
        getRendezVousConseillerPaginesQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller: '41',
          tri: undefined,
          dateDebut: new Date(dateString),
          dateFin: undefined,
          presenceConseiller: undefined
        },
        unUtilisateurDecode()
      )
    })
    it('renvoie 206 quand dateFin seulement', async () => {
      // Given
      getRendezVousConseillerPaginesQueryHandler.execute.resolves(success([]))

      // When - Then
      await request(app.getHttpServer())
        .get(`/v2/conseillers/41/rendezvous?dateFin=${dateString}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.PARTIAL_CONTENT)

      expect(
        getRendezVousConseillerPaginesQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller: '41',
          tri: undefined,
          dateDebut: undefined,
          dateFin: new Date(dateString),
          presenceConseiller: undefined
        },
        unUtilisateurDecode()
      )
    })
    it('renvoie 206 quand dateFin superieure à dateDebut', async () => {
      // Given
      getRendezVousConseillerPaginesQueryHandler.execute.resolves(success([]))

      // When - Then
      await request(app.getHttpServer())
        .get(
          `/v2/conseillers/41/rendezvous?dateDebut=${dateString}&dateFin=${dateStringPlusRecente}`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.PARTIAL_CONTENT)

      expect(
        getRendezVousConseillerPaginesQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller: '41',
          tri: undefined,
          dateDebut: new Date(dateString),
          dateFin: new Date(dateStringPlusRecente),
          presenceConseiller: undefined
        },
        unUtilisateurDecode()
      )
    })
    it('renvoie 206 quand dateFin inferieure à dateDebut', async () => {
      // Given
      getRendezVousConseillerPaginesQueryHandler.execute
        .withArgs(
          {
            idConseiller: '41',
            presenceConseiller: undefined,
            tri: undefined,
            dateDebut: new Date(dateStringPlusRecente),
            dateFin: new Date(dateString)
          },
          unUtilisateurDecode()
        )
        .resolves(success([]))

      // When - Then
      await request(app.getHttpServer())
        .get(
          `/v2/conseillers/41/rendezvous?dateDebut=${dateStringPlusRecente}&dateFin=${dateString}`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.PARTIAL_CONTENT)

      expect(
        getRendezVousConseillerPaginesQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller: '41',
          tri: undefined,
          dateDebut: new Date(dateStringPlusRecente),
          dateFin: new Date(dateString),
          presenceConseiller: undefined
        },
        unUtilisateurDecode()
      )
    })
  })

  describe('GET /v2/conseillers/{idConseiller}/actions', () => {
    describe('quand la query est au bon format', () => {
      it('retourne les actions à qualifier', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller: 'un-id-conseiller',
          page: 2,
          limit: undefined,
          codesCategories: undefined,
          aQualifier: true,
          tri: undefined
        }
        const resultat = {
          pagination: {
            page: 1,
            limit: 10,
            total: 0
          },
          resultats: []
        }

        getActionsConseillerQueryHandler.execute
          .withArgs(query, unUtilisateurDecode())
          .resolves(success(resultat))

        // When - Then
        await request(app.getHttpServer())
          .get(
            `/v2/conseillers/${query.idConseiller}/actions?page=2&aQualifier=true`
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(resultat))
      })
      it('retourne les actions pas à qualifier', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller: 'un-id-conseiller',
          page: 2,
          limit: undefined,
          codesCategories: undefined,
          aQualifier: false,
          tri: undefined
        }
        const resultat = {
          pagination: {
            page: 1,
            limit: 10,
            total: 0
          },
          resultats: []
        }

        getActionsConseillerQueryHandler.execute
          .withArgs(query, unUtilisateurDecode())
          .resolves(success(resultat))

        // When - Then
        await request(app.getHttpServer())
          .get(
            `/v2/conseillers/${query.idConseiller}/actions?page=2&aQualifier=false`
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(resultat))
      })
      it('retourne toutes les actions', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller: 'un-id-conseiller',
          page: 2,
          limit: undefined,
          codesCategories: undefined,
          aQualifier: undefined,
          tri: undefined
        }
        const resultat = {
          pagination: {
            page: 1,
            limit: 10,
            total: 0
          },
          resultats: []
        }

        getActionsConseillerQueryHandler.execute
          .withArgs(query, unUtilisateurDecode())
          .resolves(success(resultat))

        // When - Then
        await request(app.getHttpServer())
          .get(`/v2/conseillers/${query.idConseiller}/actions?page=2`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(resultat))
      })
      it('retourne les actions avec les catégories demandées', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller: 'un-id-conseiller',
          page: 2,
          limit: undefined,
          codesCategories: [
            Action.Qualification.Code.SANTE,
            Action.Qualification.Code.CITOYENNETE
          ],
          aQualifier: undefined,
          tri: undefined
        }
        const resultat = {
          pagination: {
            page: 1,
            limit: 10,
            total: 0
          },
          resultats: []
        }

        getActionsConseillerQueryHandler.execute
          .withArgs(query, unUtilisateurDecode())
          .resolves(success(resultat))

        // When - Then
        await request(app.getHttpServer())
          .get(
            `/v2/conseillers/${query.idConseiller}/actions?page=2&codesCategories=SANTE&codesCategories=CITOYENNETE`
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(resultat))
      })
      it('retourne les actions triées', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller: 'un-id-conseiller',
          page: 2,
          limit: undefined,
          codesCategories: undefined,
          aQualifier: undefined,
          tri: TriActionsConseillerV2.BENEFICIAIRE_ALPHABETIQUE
        }
        const resultat = {
          pagination: {
            page: 1,
            limit: 10,
            total: 0
          },
          resultats: []
        }

        getActionsConseillerQueryHandler.execute
          .withArgs(query, unUtilisateurDecode())
          .resolves(success(resultat))

        // When - Then
        await request(app.getHttpServer())
          .get(
            `/v2/conseillers/${query.idConseiller}/actions?page=2&tri=BENEFICIAIRE_ALPHABETIQUE`
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(resultat))
      })
    })

    describe('quand la query est au mauvais format', () => {
      it("retourne une erreur 400 quand page n'est pas un number", async () => {
        await request(app.getHttpServer())
          .get(`/v2/conseillers/un-id-conseiller/actions?page=trois`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/v2/conseillers/2/actions')
  })
})
