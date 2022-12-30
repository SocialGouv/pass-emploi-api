import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/create-liste-de-diffusion.command.handler'
import { DeleteListeDeDiffusionCommandHandler } from '../../../src/application/commands/delete-liste-de-diffusion.command.handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { GetListesDeDiffusionDuConseillerQueryHandler } from '../../../src/application/queries/get-listes-de-diffusion-du-conseiller.query.handler.db'
import {
  UpdateListeDeDiffusionCommand,
  UpdateListeDeDiffusionCommandHandler
} from '../../../src/application/commands/update-liste-de-diffusion.command.handler'
import { GetDetailListeDeDiffusionQueryHandler } from '../../../src/application/queries/get-detail-liste-de-diffusion.query.handler.db'
import { ListeDeDiffusionQueryModel } from '../../../src/application/queries/query-models/liste-de-diffusion.query-model'
import { uneDate } from '../../fixtures/date.fixture'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('ListesDeDiffusionController', () => {
  let createListeDeDiffusionCommandHandler: StubbedClass<CreateListeDeDiffusionCommandHandler>
  let updateListeDeDiffusionCommandHandler: StubbedClass<UpdateListeDeDiffusionCommandHandler>
  let getListesDeDiffusionQueryHandler: StubbedClass<GetListesDeDiffusionDuConseillerQueryHandler>
  let deleteListeDeDiffusionCommandHandler: StubbedClass<DeleteListeDeDiffusionCommandHandler>
  let getDetailListeDeDiffusionQueryHandler: StubbedClass<GetDetailListeDeDiffusionQueryHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    createListeDeDiffusionCommandHandler = app.get(
      CreateListeDeDiffusionCommandHandler
    )
    updateListeDeDiffusionCommandHandler = app.get(
      UpdateListeDeDiffusionCommandHandler
    )
    getListesDeDiffusionQueryHandler = app.get(
      GetListesDeDiffusionDuConseillerQueryHandler
    )
    deleteListeDeDiffusionCommandHandler = app.get(
      DeleteListeDeDiffusionCommandHandler
    )
    getDetailListeDeDiffusionQueryHandler = app.get(
      GetDetailListeDeDiffusionQueryHandler
    )
  })

  describe('POST /conseillers/{idConseiller}/listes-de-diffusion', () => {
    describe('quand la commande est en succès', () => {
      it('retourne une 201', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const idsBeneficiaires: string[] = []
        const command: CreateListeDeDiffusionCommand = {
          idConseiller,
          titre: '',
          idsBeneficiaires
        }
        createListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/listes-de-diffusion`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires })
          // Then
          .expect(HttpStatus.CREATED)
      })
    })
    describe('quand la commande retourne échoue en NonTrouve', () => {
      it('retourne une 404', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const idsBeneficiaires: string[] = []
        const command: CreateListeDeDiffusionCommand = {
          idConseiller,
          titre: '',
          idsBeneficiaires
        }
        createListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('Conseiller', idConseiller)))

        // When
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/listes-de-diffusion`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires })
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    describe('quand le payload est au mauvais format', () => {
      it('retourne une 400', async () => {
        // Given
        const idConseiller = 'un-id-conseiller'
        const idsBeneficiaires = 'un-payload-du-mauvais-type'

        // When
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/listes-de-diffusion`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/2/listes-de-diffusion'
    )
  })

  describe('PUT /listes-de-diffusion/{idListe}', () => {
    describe('quand la commande est en succès', () => {
      it('retourne une 200', async () => {
        // Given
        const idsBeneficiaires: string[] = []
        const idListe = 'un-id-liste'
        const command: UpdateListeDeDiffusionCommand = {
          id: idListe,
          titre: 'un titre',
          idsBeneficiaires
        }
        updateListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .put(`/listes-de-diffusion/${idListe}`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: 'un titre', idsBeneficiaires })
          // Then
          .expect(HttpStatus.OK)
      })
    })
    describe('quand la commande retourne échoue en NonTrouve', () => {
      it('retourne une 404', async () => {
        // Given
        const idsBeneficiaires: string[] = []
        const idListe = 'un-id-liste'
        const command: UpdateListeDeDiffusionCommand = {
          id: idListe,
          titre: 'un titre',
          idsBeneficiaires
        }
        updateListeDeDiffusionCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('ListeDeDiffusion')))

        // When
        await request(app.getHttpServer())
          .put(`/listes-de-diffusion/${idListe}`)
          .set('authorization', unHeaderAuthorization())
          .send({ titre: 'un titre', idsBeneficiaires })
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    describe('quand le payload est au mauvais format', () => {
      it('retourne une 400', async () => {
        // When
        await request(app.getHttpServer())
          .put('/listes-de-diffusion/1')
          .set('authorization', unHeaderAuthorization())
          .send({ titre: '', idsBeneficiaires: 'un-payload-du-mauvais-type' })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('put', '/listes-de-diffusion/1')
  })

  describe('GET /conseillers/{idConseiller}/listes-de-diffusion', () => {
    it('retourne les liste de diffusion quand la query est en succès', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      getListesDeDiffusionQueryHandler.execute.resolves(success([]))

      // When
      await request(app.getHttpServer())
        .get(`/conseillers/${idConseiller}/listes-de-diffusion`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect([])
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/2/listes-de-diffusion'
    )
    it('retourne une 403 quand l’utilisateur n‘a pas les droits', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      getListesDeDiffusionQueryHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When
      await request(app.getHttpServer())
        .get(`/conseillers/${idConseiller}/listes-de-diffusion`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })
  })

  describe('DELETE /listes-de-diffusion/{idListeDeDiffusion}', () => {
    it('supprime la liste de diffusion', async () => {
      // Given
      deleteListeDeDiffusionCommandHandler.execute.resolves(emptySuccess())

      // When
      await request(app.getHttpServer())
        .delete('/listes-de-diffusion/idListeDeDiffusion')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.NO_CONTENT)

      expect(
        deleteListeDeDiffusionCommandHandler.execute
      ).to.have.been.calledOnceWith({
        idListeDeDiffusion: 'idListeDeDiffusion'
      })
    })

    it('retourne une 403 quand l‘utilisateur n‘a pas les droits', async () => {
      // Given
      deleteListeDeDiffusionCommandHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When
      await request(app.getHttpServer())
        .delete(`/listes-de-diffusion/idListeDeDiffusion`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'delete',
      '/listes-de-diffusion/idListeDeDiffusion'
    )
  })

  describe('GET /listes-de-diffusion/{idListeDeDiffusion}', () => {
    it('retourne la liste de diffusion quand la query est en succès', async () => {
      // Given
      const idListe = 'id-liste'
      const liste: ListeDeDiffusionQueryModel = {
        id: idListe,
        titre: 'titre-liste',
        dateDeCreation: uneDate(),
        beneficiaires: [
          { id: 'id-benef', nom: 'nom-benef', prenom: 'prenom-benef' }
        ]
      }
      const listeAttendue = {
        id: idListe,
        titre: 'titre-liste',
        dateDeCreation: uneDate().toISOString(),
        beneficiaires: [
          { id: 'id-benef', nom: 'nom-benef', prenom: 'prenom-benef' }
        ]
      }
      getDetailListeDeDiffusionQueryHandler.execute.resolves(success(liste))

      // When
      await request(app.getHttpServer())
        .get(`/listes-de-diffusion/${idListe}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(listeAttendue)
    })
    it('retourne une 403 quand l’utilisateur n‘a pas les droits', async () => {
      // Given
      const idListe = 'id-liste'
      getDetailListeDeDiffusionQueryHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When
      await request(app.getHttpServer())
        .get(`/listes-de-diffusion/${idListe}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/listes-de-diffusion/idListeDeDiffusion'
    )
  })
})
