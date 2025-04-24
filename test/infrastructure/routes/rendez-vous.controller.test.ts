import { HttpStatus, INestApplication } from '@nestjs/common'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import {
  CloreRendezVousPayload,
  CreateRendezVousPayload,
  UpdateRendezVousPayload
} from 'src/infrastructure/routes/validation/rendez-vous.inputs'
import * as request from 'supertest'
import { CreateRendezVousCommandHandler } from '../../../src/application/commands/create-rendez-vous.command.handler'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../../src/application/commands/delete-rendez-vous.command.handler.db'
import { RendezVousJeuneQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { GetAnimationsCollectivesJeuneQueryHandler } from '../../../src/application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetDetailRendezVousJeuneQueryHandler } from '../../../src/application/queries/rendez-vous/get-detail-rendez-vous-jeune.query.handler.db'
import { GetDetailRendezVousQueryHandler } from '../../../src/application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import { GetRendezVousConseillerPaginesQueryHandler } from '../../../src/application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../../src/application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import {
  JeuneNonLieAuConseillerError,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { Cached } from '../../../src/building-blocks/types/query'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { CodeTypeRendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVousJeuneDetailQueryModel } from '../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import {
  CloreRendezVousCommand,
  CloreRendezVousCommandHandler
} from '../../../src/application/commands/clore-rendez-vous.command.handler'

describe('RendezvousController', () => {
  let getDetailRendezVousQueryHandler: StubbedClass<GetDetailRendezVousQueryHandler>
  let deleteRendezVousCommandHandler: StubbedClass<DeleteRendezVousCommandHandler>
  let updateRendezVousCommandHandler: StubbedClass<UpdateRendezVousCommandHandler>
  let createRendezVousCommandHandler: StubbedClass<CreateRendezVousCommandHandler>
  let cloreRendezVousCommandHandler: StubbedClass<CloreRendezVousCommandHandler>
  let getRendezVousConseillerPaginesQueryHandler: StubbedClass<GetRendezVousConseillerPaginesQueryHandler>
  let getRendezVousJeunePoleEmploiQueryHandler: StubbedClass<GetRendezVousJeunePoleEmploiQueryHandler>
  let getDetailRendezVousJeuneQueryHandler: StubbedClass<GetDetailRendezVousJeuneQueryHandler>
  let getAnimationsCollectivesJeuneQueryHandler: StubbedClass<GetAnimationsCollectivesJeuneQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getDetailRendezVousQueryHandler = app.get(GetDetailRendezVousQueryHandler)
    deleteRendezVousCommandHandler = app.get(DeleteRendezVousCommandHandler)
    cloreRendezVousCommandHandler = app.get(CloreRendezVousCommandHandler)
    updateRendezVousCommandHandler = app.get(UpdateRendezVousCommandHandler)
    getRendezVousConseillerPaginesQueryHandler = app.get(
      GetRendezVousConseillerPaginesQueryHandler
    )
    createRendezVousCommandHandler = app.get(CreateRendezVousCommandHandler)
    getRendezVousJeunePoleEmploiQueryHandler = app.get(
      GetRendezVousJeunePoleEmploiQueryHandler
    )
    getDetailRendezVousJeuneQueryHandler = app.get(
      GetDetailRendezVousJeuneQueryHandler
    )
    getAnimationsCollectivesJeuneQueryHandler = app.get(
      GetAnimationsCollectivesJeuneQueryHandler
    )
    jwtService = app.get(JwtService)
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
  describe('POST rendezvous/:idRendezVous/cloturer', () => {
    const rendezvous = unRendezVous()
    it('clos le rendez-vous à present', async () => {
      // Given
      const payload: CloreRendezVousPayload = {
        present: true
      }
      const expectedCommand: CloreRendezVousCommand = {
        idRendezVous: rendezvous.id,
        present: true
      }
      cloreRendezVousCommandHandler.execute.resolves(emptySuccess())
      // When - Then
      await request(app.getHttpServer())
        .post(`/rendezvous/${rendezvous.id}/cloturer`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.CREATED)

      expect(
        cloreRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(expectedCommand, unUtilisateurDecode())
    })
    it('clos le rendez-vous à abset', async () => {
      // Given
      const payload: CloreRendezVousPayload = {
        present: false
      }
      const expectedCommand: CloreRendezVousCommand = {
        idRendezVous: rendezvous.id,
        present: false
      }
      cloreRendezVousCommandHandler.execute.resolves(emptySuccess())
      // When - Then
      await request(app.getHttpServer())
        .post(`/rendezvous/${rendezvous.id}/cloturer`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.CREATED)

      expect(
        cloreRendezVousCommandHandler.execute
      ).to.have.be.calledWithExactly(expectedCommand, unUtilisateurDecode())
    })
    it('bad request', async () => {
      // Given
      const payload = {
        present: 'true'
      }

      cloreRendezVousCommandHandler.execute.resolves(emptySuccess())
      // When - Then
      await request(app.getHttpServer())
        .post(`/rendezvous/${rendezvous.id}/cloturer`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/rendezvous/123/cloturer')
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

  describe('POST /conseillers/:idConseiller/rendezvous', () => {
    describe('quand le payload est bon', () => {
      describe('quand la commande est en succes', () => {
        beforeEach(() => {
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))
        })
        it('crée le rendezvous avec jeunesIds', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true
          }

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })

          expect(
            createRendezVousCommandHandler.execute
          ).to.have.been.calledWith(
            {
              idsJeunes: payload.jeunesIds,
              commentaire: payload.comment,
              date: payload.date,
              duree: payload.duration,
              modalite: payload.modality,
              idConseiller: idConseiller,
              type: undefined,
              precision: undefined,
              titre: undefined,
              adresse: undefined,
              organisme: undefined,
              presenceConseiller: undefined,
              invitation: true,
              nombreMaxParticipants: undefined
            },
            unUtilisateurDecode()
          )
        })
        it("crée le rendezvous sans jeunesIds quand c'est une animation collective", async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: [],
            comment: '',
            titre: 'aa',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true,
            type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
          }

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })
        })
        it("crée le rendezvous avec jeunesIds quand c'est une animation collective", async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            titre: 'aa',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true,
            type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
          }

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })
        })
        it('retourne une 200 quand presenceConseiller est undefined pour le type ENTRETIEN_CONSEILLER', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 200 quand presenceConseiller est undefined pour le type par defaut', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 200 quand presenceConseiller est true pour le type ENTRETIEN_CONSEILLER', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
            presenceConseiller: true
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 200 quand presenceConseiller est true pour le type par defaut', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            presenceConseiller: true
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 201 quand le champ precision est rempli', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            type: CodeTypeRendezVous.AUTRE,
            precision: 'aa'
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })
        })
      })
      describe('quand la commande est en echec', () => {
        it('retourne une 403 quand une failure JeuneNonLieAuConseiller est renvoyée', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true
          }
          createRendezVousCommandHandler.execute.resolves(
            failure(new JeuneNonLieAuConseillerError('41', '1'))
          )

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.FORBIDDEN)
        })
      })
    })
    describe("quand le payload n'est pas bon", () => {
      it('retourne une 400 les jeunes sont vide pour une rdv autre que animation collective', async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: [],
          comment: '',
          titre: 'aa',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          modality: 'rdv',
          invitation: true
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it("retourne une 400 quand la date n'est pas une dateString", async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: '',
          duration: 30
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it("retourne une 400 quand le type n'est pas bon", async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          type: 'blabla'
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('retourne une 400 quand presenceConseiller est false pour le type ENTRETIEN_CONSEILLER', async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
          presenceConseiller: false
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('retourne une 400 quand presenceConseiller est false pour le type par defaut', async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          presenceConseiller: false
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it("retourne une 400 quand le champ precision n'est pas rempli", async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          type: CodeTypeRendezVous.AUTRE
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
  })

  describe('GET /jeunes/:idJeune/rendez-vous', () => {
    const idJeune = '1'
    it("renvoie une 404 quand le jeune n'existe pas", async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
        failure(new NonTrouveError('Jeune', '1'))
      )
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('retourne les rdv', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
        success({ queryModel: [] })
      )

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect([])
    })
    it('renvoie une 500 quand la query est cachée', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      const data: Cached<RendezVousJeuneQueryModel[]> = {
        queryModel: [],
        dateDuCache: uneDatetime()
      }
      getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(success(data))
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/rendezvous')
  })

  describe('GET /v2/jeunes/:idJeune/rendez-vous', () => {
    const idJeune = '1'
    it('renvoie une 404 quand le jeune n"existe pas', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
        failure(new NonTrouveError('Jeune', '1'))
      )
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('retourne les rdv', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      const data: Cached<RendezVousJeuneQueryModel[]> = {
        queryModel: [],
        dateDuCache: uneDatetime()
      }
      getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(success(data))

      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect({
          resultat: [],
          dateDerniereMiseAJour: uneDatetime().toJSDate().toISOString()
        })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/v2/jeunes/1/rendezvous')
  })

  describe('GET /jeunes/:idJeune/rendez-vous/:idRendezVous', () => {
    const idJeune = '1'
    const idRendezVous = 'bcd60403-5f10-4a16-a660-2099d79ebd66'
    const queryModel = unRendezVousJeuneDetailQueryModel()

    it("renvoit une 404 quand le rendez vous n'existe pas", async () => {
      // Given
      getDetailRendezVousJeuneQueryHandler.execute.resolves(
        failure(new NonTrouveError('RendezVous', idRendezVous))
      )
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous/${idRendezVous}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('retourne le rendez vous', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getDetailRendezVousJeuneQueryHandler.execute
        .withArgs({ idJeune, idRendezVous }, unUtilisateurDecode())
        .resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/rendezvous/${idRendezVous}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(queryModel))
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/rendezvous/2')
  })

  describe('GET /jeunes/:idJeune/animations-collectives', () => {
    const idJeune = '1'
    it('retourne la home agenda du jeune quand tout se passe bien', async () => {
      // Given
      getAnimationsCollectivesJeuneQueryHandler.execute.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/animations-collectives?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect([])
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/animations-collectives?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00'
    )
  })
})
