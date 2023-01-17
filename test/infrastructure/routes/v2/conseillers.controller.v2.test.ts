import { HttpStatus, INestApplication } from '@nestjs/common'
import { GetRendezVousConseillerPaginesQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import * as request from 'supertest'
import { success } from '../../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../../utils'
import { getApplicationWithStubbedDependencies } from '../../../utils/module-for-testing'

describe('ConseillersControllerV2', () => {
  let app: INestApplication
  let getRendezVousConseillerPaginesQueryHandler: StubbedClass<GetRendezVousConseillerPaginesQueryHandler>

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getRendezVousConseillerPaginesQueryHandler = app.get(
      GetRendezVousConseillerPaginesQueryHandler
    )
  })

  describe('GET /conseillers/:idConseiller/rendezvous', () => {
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
})
