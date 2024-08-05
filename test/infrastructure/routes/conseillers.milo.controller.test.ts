import { HttpStatus, INestApplication } from '@nestjs/common'
import { DateTime } from 'luxon'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import {
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  ErreurHttp,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { SessionMilo } from 'src/domain/milo/session.milo'
import * as request from 'supertest'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import {
  unAgendaConseillerMiloSessionListItemQueryModel,
  unDetailSessionConseillerMiloQueryModel,
  uneSessionConseillerMiloQueryModel
} from 'test/fixtures/sessions.fixture'
import { StubbedClass, expect } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../../src/application/commands/milo/creer-jeune-milo.command.handler'
import {
  QualifierActionsMiloCommand,
  QualifierActionsMiloCommandHandler
} from '../../../src/application/commands/milo/qualifier-actions-milo.command.handler'
import { GetDossierMiloJeuneQueryHandler } from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from '../../../src/application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { Action } from '../../../src/domain/action/action'
import { QualifierActionsMiloPayload } from '../../../src/infrastructure/routes/validation/conseillers.milo.inputs'
import { CreerJeuneMiloPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import { unDossierMilo } from '../../fixtures/milo.fixture'
import { unJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { GetSessionsConseillerMiloV2QueryHandler } from '../../../src/application/queries/milo/v2/get-sessions-conseiller.milo.v2.query.handler.db'
import { GetCompteursBeneficiaireMiloQueryHandler } from 'src/application/queries/milo/get-compteurs-portefeuille-milo.query.handler.db'

describe('ConseillersMiloController', () => {
  let getDossierMiloJeuneQueryHandler: StubbedClass<GetDossierMiloJeuneQueryHandler>
  let getJeuneMiloByDossierQueryHandler: StubbedClass<GetJeuneMiloByDossierQueryHandler>
  let creerJeuneMiloCommandHandler: StubbedClass<CreerJeuneMiloCommandHandler>
  let getSessionsQueryHandler: StubbedClass<GetSessionsConseillerMiloQueryHandler>
  let getDetailSessionQueryHandler: StubbedClass<GetDetailSessionConseillerMiloQueryHandler>
  let getAgendaSessionsQueryHandler: StubbedClass<GetAgendaSessionsConseillerMiloQueryHandler>
  let updateSessionCommandHandler: StubbedClass<UpdateSessionMiloCommandHandler>
  let qualifierActionsMiloCommandHandler: StubbedClass<QualifierActionsMiloCommandHandler>
  let getSessionsV2QueryHandler: StubbedClass<GetSessionsConseillerMiloV2QueryHandler>
  let getCompteursBeneficiaireMiloQueryHandler: StubbedClass<GetCompteursBeneficiaireMiloQueryHandler>

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    getDossierMiloJeuneQueryHandler = app.get(GetDossierMiloJeuneQueryHandler)
    getJeuneMiloByDossierQueryHandler = app.get(
      GetJeuneMiloByDossierQueryHandler
    )
    creerJeuneMiloCommandHandler = app.get(CreerJeuneMiloCommandHandler)
    getSessionsQueryHandler = app.get(GetSessionsConseillerMiloQueryHandler)
    getDetailSessionQueryHandler = app.get(
      GetDetailSessionConseillerMiloQueryHandler
    )
    getAgendaSessionsQueryHandler = app.get(
      GetAgendaSessionsConseillerMiloQueryHandler
    )
    updateSessionCommandHandler = app.get(UpdateSessionMiloCommandHandler)
    qualifierActionsMiloCommandHandler = app.get(
      QualifierActionsMiloCommandHandler
    )
    getSessionsV2QueryHandler = app.get(GetSessionsConseillerMiloV2QueryHandler)
    getCompteursBeneficiaireMiloQueryHandler = app.get(
      GetCompteursBeneficiaireMiloQueryHandler
    )
  })

  describe('GET /conseillers/milo/dossiers/:idDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le dossier', async () => {
        // Given
        getDossierMiloJeuneQueryHandler.execute
          .withArgs({ idDossier: '1' }, unUtilisateurDecode())
          .resolves(success(unDossierMilo()))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/dossiers/1')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(unDossierMilo()))
      })
    })

    describe("quand le dossier n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        getDossierMiloJeuneQueryHandler.execute
          .withArgs({ idDossier: '2' }, unUtilisateurDecode())
          .resolves(failure(new ErreurHttp('Pas trouvé', 404)))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/dossiers/2')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/dossiers/2'
    )
  })

  describe('GET /conseillers/milo/jeunes/:idDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le jeune', async () => {
        // Given
        getJeuneMiloByDossierQueryHandler.execute
          .withArgs({ idDossier: '1' }, unUtilisateurDecode())
          .resolves(success(unJeuneQueryModel()))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/jeunes/1')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(unJeuneQueryModel()))
      })
    })

    describe("quand le dossier n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        getJeuneMiloByDossierQueryHandler.execute
          .withArgs({ idDossier: '2' }, unUtilisateurDecode())
          .resolves(failure(new ErreurHttp('Pas trouvé', 404)))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/jeunes/2')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/dossiers/2'
    )
  })

  describe('POST /conseillers/milo/jeunes', () => {
    describe('quand le jeune est nouveau', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        const payload: CreerJeuneMiloPayload = {
          idDossier: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        creerJeuneMiloCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(success({ id: 'idJeune', prenom: 'prenom', nom: 'nom' }))

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)
          .expect({ id: 'idJeune', prenom: 'prenom', nom: 'nom' })
      })
    })

    describe('quand le jeune est déjà chez nous', () => {
      it('renvoie 400', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'ID400',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new ErreurHttp('email pas bon', 400))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send({ ...command, idDossier: command.idPartenaire })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    describe('quand le mail existe déja', () => {
      it('renvoie 409', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'ID409',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new EmailExisteDejaError('test@test.fr'))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send({ ...command, idDossier: command.idPartenaire })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CONFLICT)
      })
    })

    describe("quand l'id dossier existe déja", () => {
      it('renvoie 409', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'ID409',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new DossierExisteDejaError('ID409'))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send({ ...command, idDossier: command.idPartenaire })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CONFLICT)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/dossiers/2'
    )
  })

  describe('GET /conseillers/milo/:idConseiller/sessions', () => {
    describe('quand le conseiller a une structure milo renseignée', () => {
      it('renvoie une 200', async () => {
        // Given
        getSessionsQueryHandler.execute.resolves(
          success([uneSessionConseillerMiloQueryModel])
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect([uneSessionConseillerMiloQueryModel])

        expect(
          getSessionsQueryHandler.execute
        ).to.have.been.calledOnceWithExactly(
          {
            idConseiller: 'id-conseiller',
            accessToken: 'coucou',
            dateDebut: undefined,
            dateFin: undefined,
            filtrerAClore: undefined
          },
          unUtilisateurDecode()
        )
      })
    })

    describe('quand le conseiller n’a pas de structure milo renseignée', () => {
      it('renvoie une 404', async () => {
        // Given
        getSessionsQueryHandler.execute.resolves(
          failure(new NonTrouveError('Conseiller Milo', 'id-conseiller'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/sessions'
    )
  })

  describe('GET /conseillers/milo/:idConseiller/sessions/:idSession', () => {
    it('renvoie une 200 quand tout va bien', async () => {
      // Given
      const idSession = '123'
      getDetailSessionQueryHandler.execute.resolves(
        success(unDetailSessionConseillerMiloQueryModel)
      )

      // When - Then
      await request(app.getHttpServer())
        .get(`/conseillers/milo/id-conseiller/sessions/${idSession}`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(unDetailSessionConseillerMiloQueryModel)

      expect(
        getDetailSessionQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idSession,
          idConseiller: 'id-conseiller',
          accessToken: 'coucou'
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/sessions'
    )
  })

  describe('GET /conseillers/milo/:idConseiller/agenda/sessions', () => {
    it('renvoie une 200 quand tout va bien', async () => {
      // Given
      getAgendaSessionsQueryHandler.execute.resolves(
        success([
          {
            ...unAgendaConseillerMiloSessionListItemQueryModel,
            nbPlacesRestantes: 1
          }
        ])
      )

      // When - Then
      await request(app.getHttpServer())
        .get(
          `/conseillers/milo/id-conseiller/agenda/sessions?dateDebut=2023-01-01&dateFin=2023-01-08`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect([
          {
            ...unAgendaConseillerMiloSessionListItemQueryModel,
            nbPlacesRestantes: 1
          }
        ])

      expect(
        getAgendaSessionsQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idConseiller: 'id-conseiller',
          accessToken: 'coucou',
          dateDebut: DateTime.fromISO('2023-01-01'),
          dateFin: DateTime.fromISO('2023-01-08')
        },
        unUtilisateurDecode()
      )
    })

    it('renvoie une 404 quand quelque chose se passe mal', async () => {
      // Given
      getAgendaSessionsQueryHandler.execute.resolves(
        failure(new ErreurHttp('Ressource Milo introuvable', 404))
      )

      // When - Then
      await request(app.getHttpServer())
        .get(
          `/conseillers/milo/id-conseiller/agenda/sessions?dateDebut=2023-01-01&dateFin=2023-01-08`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.NOT_FOUND)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/1/agenda/sessions'
    )
  })

  describe('PATCH /conseillers/milo/:idConseiller/sessions/:idSession', () => {
    it('met à jour a visibilite', async () => {
      // Given
      const idSession = '123'
      const idConseiller = 'id-conseiller'

      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idConseiller: idConseiller,
        idSession: idSession,
        accessToken: 'coucou',
        inscriptions: undefined
      }

      updateSessionCommandHandler.execute
        .withArgs(command, unUtilisateurDecode())
        .resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .patch(`/conseillers/milo/${idConseiller}/sessions/${idSession}`)
        .send({
          estVisible: true
        })
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)

      expect(
        updateSessionCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command, unUtilisateurDecode())
    })

    it('inscrit des jeunes à une session milo', async () => {
      // Given
      const listeInscrits = [
        {
          idJeune: 'jeune-1',
          statut: SessionMilo.Modification.StatutInscription.INSCRIT
        },
        {
          idJeune: 'jeune-2',
          statut: SessionMilo.Modification.StatutInscription.REFUS_JEUNE,
          commentaire: 'J’ai pas envie'
        },
        {
          idJeune: 'jeune-3',
          statut: SessionMilo.Modification.StatutInscription.REFUS_TIERS
        }
      ]
      const idSession = '123'
      const idConseiller = 'id-conseiller'

      const command: UpdateSessionMiloCommand = {
        estVisible: true,
        idConseiller: idConseiller,
        idSession: idSession,
        accessToken: 'coucou',
        inscriptions: listeInscrits
      }

      updateSessionCommandHandler.execute
        .withArgs(command, unUtilisateurDecode())
        .resolves(emptySuccess())

      // When - Then
      await request(app.getHttpServer())
        .patch(`/conseillers/milo/${idConseiller}/sessions/${idSession}`)
        .send({
          estVisible: true,
          inscriptions: listeInscrits
        })
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)

      expect(
        updateSessionCommandHandler.execute
      ).to.have.been.calledOnceWithExactly(command, unUtilisateurDecode())
    })

    ensureUserAuthenticationFailsIfInvalid(
      'patch',
      '/conseillers/milo/1/sessions/id-session'
    )
  })

  describe('POST /conseillers/milo/actions/qualifier', () => {
    it('qualifie les actions', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      const command: QualifierActionsMiloCommand = {
        estSNP: true,
        qualifications: [
          {
            idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
            codeQualification: Action.Qualification.Code.EMPLOI
          }
        ]
      }

      qualifierActionsMiloCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(
          success({
            code: Action.Qualification.Code.EMPLOI,
            idsActionsQualifiees: [],
            idsActionsEnErreur: []
          })
        )

      const payload: QualifierActionsMiloPayload = {
        estSNP: true,
        qualifications: [
          {
            idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
            codeQualification: Action.Qualification.Code.EMPLOI
          }
        ]
      }

      // When
      await request(app.getHttpServer())
        .post(`/conseillers/milo/actions/qualifier`)
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.CREATED)

      expect(
        qualifierActionsMiloCommandHandler.execute
      ).to.have.been.calledWithExactly(command, utilisateur)
    })
    it("retourne une erreur non autorisée pour un utilisateur n'ayant pas les droits", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      const command: QualifierActionsMiloCommand = {
        estSNP: false,
        qualifications: [
          {
            idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
            codeQualification: Action.Qualification.Code.EMPLOI
          }
        ]
      }

      const payload: QualifierActionsMiloPayload = {
        estSNP: false,
        qualifications: [
          {
            idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
            codeQualification: Action.Qualification.Code.EMPLOI
          }
        ]
      }

      qualifierActionsMiloCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(failure(new DroitsInsuffisants()))

      // When
      await request(app.getHttpServer())
        .post(`/conseillers/milo/actions/qualifier`)
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })
    it('retourne une BAD_REQUEST lorsque le tableau est vide', async () => {
      // Given
      const payload: QualifierActionsMiloPayload = {
        estSNP: true,
        qualifications: []
      }

      // When
      await request(app.getHttpServer())
        .post(`/conseillers/milo/actions/qualifier`)
        .send(payload)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/milo/actions/qualifier'
    )
  })

  describe('GET /v2/conseillers/milo/:idConseiller/sessions', () => {
    describe('quand le conseiller a une structure milo renseignée', () => {
      it('renvoie une 200', async () => {
        // Given
        const response = {
          pagination: {
            page: 1,
            limit: 10,
            total: 1
          },
          resultats: [uneSessionConseillerMiloQueryModel]
        }
        getSessionsV2QueryHandler.execute.resolves(success(response))

        // When - Then
        await request(app.getHttpServer())
          .get('/v2/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(response)

        expect(
          getSessionsV2QueryHandler.execute
        ).to.have.been.calledOnceWithExactly(
          {
            idConseiller: 'id-conseiller',
            accessToken: 'coucou',
            page: undefined,
            filtrerAClore: undefined
          },
          unUtilisateurDecode()
        )
      })
    })

    describe('quand le conseiller n’a pas de structure milo renseignée', () => {
      it('renvoie une 404', async () => {
        // Given
        getSessionsV2QueryHandler.execute.resolves(
          failure(new NonTrouveError('Conseiller Milo', 'id-conseiller'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/v2/conseillers/milo/id-conseiller/sessions')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/v2/conseillers/milo/1/sessions'
    )
  })

  describe('GET /conseiller/milo/:idConseiller/compteurs-portefeuille', () => {
    describe('quand les jeunes ont des trucs à compter', () => {
      it('renvoie les trucs à compter par jeune', async () => {
        // Given
        const query = {
          idConseiller: 'id-conseiller',
          dateDebut: DateTime.fromISO('2024-07-01', {
            setZone: true
          }),
          dateFin: DateTime.fromISO('2024-07-26', {
            setZone: true
          })
        }
        const queryModel = [{ idBeneficiaire: 'id-beneficiaire', actions: 3 }]

        getCompteursBeneficiaireMiloQueryHandler.execute.resolves(
          success(queryModel)
        )

        // When - Then
        await request(app.getHttpServer())
          .get(
            '/conseillers/milo/id-conseiller/compteurs-portefeuille?dateDebut=2024-07-01&dateFin=2024-07-26'
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(queryModel))

        expect(
          getCompteursBeneficiaireMiloQueryHandler.execute
        ).to.have.been.calledOnceWithExactly(query, unUtilisateurDecode())
      })
    })
  })
})
