import { HttpStatus, INestApplication } from '@nestjs/common'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler.db'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import { UpdateRendezVousPayload } from 'src/infrastructure/routes/validation/rendez-vous.inputs'
import { GetDetailRendezVousQueryHandler } from '../../../src/application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('RendezvousController', () => {
  let getDetailRendezVousQueryHandler: StubbedClass<GetDetailRendezVousQueryHandler>
  let deleteRendezVousCommandHandler: StubbedClass<DeleteRendezVousCommandHandler>
  let updateRendezVousCommandHandler: StubbedClass<UpdateRendezVousCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getDetailRendezVousQueryHandler = app.get(GetDetailRendezVousQueryHandler)
    deleteRendezVousCommandHandler = app.get(DeleteRendezVousCommandHandler)
    updateRendezVousCommandHandler = app.get(UpdateRendezVousCommandHandler)
  })

  describe('GET rendezvous/:idRendezVous', () => {
    const jeune = unJeune()
    const rendezvous = unRendezVous({ jeunes: [jeune] })

    it('récupère le rendez-vous sans l‘historique si aucun paramètre n‘est renseigné', async () => {
      //Given
      getDetailRendezVousQueryHandler.execute.resolves(
        success({
          id: rendezvous.id,
          date: rendezvous.date,
          jeunes: [],
          type: { code: rendezvous.type, label: '' },
          title: rendezvous.titre,
          duration: rendezvous.duree,
          modality: rendezvous.modalite!,
          invitation: rendezvous.invitation!,
          source: rendezvous.source
        })
      )
      //When - Then
      await request(app.getHttpServer())
        .get(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(res => {
          return res.body.historique === undefined
        })
    })
    it('récupère le rendez-vous', async () => {
      //Given
      getDetailRendezVousQueryHandler.execute
        .withArgs({ idRendezVous: rendezvous.id })
        .resolves(
          success({
            id: rendezvous.id,
            date: rendezvous.date,
            jeunes: [],
            type: { code: rendezvous.type, label: '' },
            title: rendezvous.titre,
            duration: rendezvous.duree,
            modality: rendezvous.modalite!,
            invitation: rendezvous.invitation!,
            historique: [],
            source: rendezvous.source
          })
        )
      //When - Then
      await request(app.getHttpServer())
        .get(`/rendezvous/${rendezvous.id}?avecHistorique=true`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(res => {
          return res.body.historique.isArray
        })
    })
    ensureUserAuthenticationFailsIfInvalid('GET', '/rendezvous/123')
  })
  describe('DELETE rendezvous/:idRendezVous', () => {
    const jeune = unJeune()
    const rendezvous = unRendezVous({ jeunes: [jeune] })
    const command: DeleteRendezVousCommand = {
      idRendezVous: rendezvous.id
    }
    it('supprime le rendez-vous', async () => {
      // Given
      deleteRendezVousCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())
      // When
      await request(app.getHttpServer())
        .delete(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NO_CONTENT)
      expect(
        deleteRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
    })
    it('renvoie une 404 si le rendez-vous n"existe pas', async () => {
      // Given
      deleteRendezVousCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(new NonTrouveError('Rendez-vous', command.idRendezVous))
        )

      // When
      await request(app.getHttpServer())
        .delete(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it("renvoie une 400 si l'id du rendez-vous n'est pas un UUID", async () => {
      // When
      await request(app.getHttpServer())
        .delete(`/rendezvous/12`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid('delete', '/rendezvous/123')
  })
  describe('PUT rendezvous/:idRendezVous', () => {
    const jeune = unJeune()
    const rendezvous = unRendezVous({ jeunes: [jeune] })
    const payload: UpdateRendezVousPayload = {
      jeunesIds: ['1'],
      date: '2021-11-11T08:03:30.000Z',
      titre: undefined,
      comment: undefined,
      duration: 30,
      modality: undefined,
      adresse: undefined,
      organisme: undefined,
      presenceConseiller: true,
      nombreMaxParticipants: undefined
    }
    const expectedCommand: UpdateRendezVousCommand = {
      idsJeunes: ['1'],
      idRendezVous: rendezvous.id,
      titre: undefined,
      commentaire: undefined,
      date: '2021-11-11T08:03:30.000Z',
      duree: 30,
      modalite: undefined,
      adresse: undefined,
      organisme: undefined,
      presenceConseiller: true,
      nombreMaxParticipants: undefined
    }
    it('met à jour le rendez-vous', async () => {
      // Given
      updateRendezVousCommandHandler.execute.resolves(
        success({ id: rendezvous.id })
      )
      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.OK)

      expect(
        updateRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(expectedCommand, unUtilisateurDecode())
    })
    it("renvoie une 404 quand le rendez-vous n'existe pas", async () => {
      // Given
      updateRendezVousCommandHandler.execute
        .withArgs(expectedCommand)
        .resolves(
          failure(
            new NonTrouveError('Rendez-vous', expectedCommand.idRendezVous)
          )
        )

      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.NOT_FOUND)
    })
    it('renvoie une 400 (BAD REQUEST) pour une mauvaise commande', async () => {
      updateRendezVousCommandHandler.execute
        .withArgs(expectedCommand)
        .resolves(failure(new MauvaiseCommandeError('Rendez-vous')))

      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it("renvoie une 400 (BAD REQUEST) quand la date n'est pas au bon format", async () => {
      payload.date = 'aaa'
      // When - Then
      await request(app.getHttpServer())
        .put(`/rendezvous/${rendezvous.id}`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid('put', '/rendezvous/123')
  })
})
