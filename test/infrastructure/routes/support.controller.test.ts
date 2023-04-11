import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { ArchiverJeuneSupportCommandHandler } from '../../../src/application/commands/support/archiver-jeune-support.command.handler'
import { UpdateAgenceConseillerCommandHandler } from '../../../src/application/commands/support/update-agence-conseiller.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { Authentification } from '../../../src/domain/authentification'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from '../../../src/application/commands/transferer-jeunes-conseiller.command.handler'
import {
  CreerSuperviseursCommandHandler,
  CreerSuperviseursCommand
} from '../../../src/application/commands/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from '../../../src/application/commands/delete-superviseurs.command.handler'
import { Core } from '../../../src/domain/core'

describe('SupportController', () => {
  let archiverJeuneSupportCommandHandler: StubbedClass<ArchiverJeuneSupportCommandHandler>
  let updateAgenceCommandHandler: StubbedClass<UpdateAgenceConseillerCommandHandler>
  let creerSuperviseursCommandHandler: StubbedClass<CreerSuperviseursCommandHandler>
  let deleteSuperviseursCommandHandler: StubbedClass<DeleteSuperviseursCommandHandler>
  let transfererJeunesConseillerCommandHandler: StubbedClass<TransfererJeunesConseillerCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    archiverJeuneSupportCommandHandler = app.get(
      ArchiverJeuneSupportCommandHandler
    )
    updateAgenceCommandHandler = app.get(UpdateAgenceConseillerCommandHandler)
    creerSuperviseursCommandHandler = app.get(CreerSuperviseursCommandHandler)
    deleteSuperviseursCommandHandler = app.get(DeleteSuperviseursCommandHandler)
    transfererJeunesConseillerCommandHandler = app.get(
      TransfererJeunesConseillerCommandHandler
    )
  })

  describe('POST /support/archiver-jeune/:idJeune', () => {
    describe('quand la commande est en succes', () => {
      it('archive le jeune', async () => {
        // Given
        const idJeune = 'test'
        archiverJeuneSupportCommandHandler.execute.resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post('/support/archiver-jeune/test')
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NO_CONTENT)

        expect(
          archiverJeuneSupportCommandHandler.execute
        ).to.have.been.calledWith({ idJeune })
      })
    })
    describe('quand la commande est en echec', () => {
      it('throw une erreur', async () => {
        // Given
        const idJeune = 'test'
        archiverJeuneSupportCommandHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', idJeune))
        )

        // When
        await request(app.getHttpServer())
          .post('/support/archiver-jeune/test')
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)

        expect(
          archiverJeuneSupportCommandHandler.execute
        ).to.have.been.calledWith({ idJeune })
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'POST',
      '/support/archiver-jeune/test'
    )
  })

  describe('POST /support/changer-agence-conseiller', () => {
    const idConseiller = 'test'
    const idNouvelleAgence = 'b'
    describe('quand la commande est en succes', () => {
      it("change l'agence du conseiller", async () => {
        // Given
        updateAgenceCommandHandler.execute.resolves(
          success({
            idAncienneAgence: 'a',
            idNouvelleAgence: 'b',
            infosTransfertAnimationsCollectives: []
          })
        )

        // When
        await request(app.getHttpServer())
          .post('/support/changer-agence-conseiller')
          .set('authorization', unHeaderAuthorization())
          .send({ idConseiller, idNouvelleAgence })
          // Then
          .expect(HttpStatus.CREATED)

        expect(
          updateAgenceCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          { idConseiller, idNouvelleAgence },
          unUtilisateurDecode()
        )
      })
    })
    describe('quand la commande est en echec', () => {
      it('throw une erreur', async () => {
        // Given
        updateAgenceCommandHandler.execute.resolves(
          failure(new NonTrouveError('Agence', 'b'))
        )

        // When
        await request(app.getHttpServer())
          .post('/support/changer-agence-conseiller')
          .set('authorization', unHeaderAuthorization())
          .send({ idConseiller, idNouvelleAgence })
          // Then
          .expect(HttpStatus.NOT_FOUND)

        expect(
          updateAgenceCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          { idConseiller, idNouvelleAgence },
          unUtilisateurDecode()
        )
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'POST',
      '/support/changer-agence-conseiller'
    )
  })

  describe('POST /support/transferer-jeunes', () => {
    describe('quand tous les paramètres sont renseignés', () => {
      it('retourne un succès', async () => {
        // Given
        const payload = {
          idConseillerSource: 'id-conseiller-source',
          idConseillerCible: 'id-conseiller-cible',
          idsJeunes: ['1']
        }

        const command: TransfererJeunesConseillerCommand = {
          ...payload,
          estTemporaire: false,
          structure: undefined,
          provenanceUtilisateur: Authentification.Type.SUPPORT
        }
        transfererJeunesConseillerCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post('/support/transferer-jeunes')
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.NO_CONTENT)

        expect(
          transfererJeunesConseillerCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(command, unUtilisateurDecode())
      })
    })

    ensureUserAuthenticationFailsIfInvalid('POST', '/support/transferer-jeunes')
  })

  describe('POST /support/superviseurs', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superviseurs: [
            { email: 'test@octo.com', structure: Core.Structure.MILO }
          ]
        }

        creerSuperviseursCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post('/support/superviseurs')
          .send(command)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)
      })
    })
    describe("quand le payload n'est pas valide", () => {
      it('renvoie 400 quand le champ email est pas bon', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test', structure: Core.Structure.MILO }]
        }

        // When - Then
        await request(app.getHttpServer())
          .post('/support/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie 400 quand le superviseur est incomplet', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test@octo.com' }]
        }

        // When - Then
        await request(app.getHttpServer())
          .post('/support/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/conseillers/superviseurs')
  })

  describe('DELETE /support/superviseurs', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superviseurs: [
            { email: 'test@octo.com', structure: Core.Structure.MILO }
          ]
        }

        deleteSuperviseursCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .delete('/support/superviseurs')
          .send(command)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NO_CONTENT)
      })
    })
    describe("quand le payload n'est pas valide", () => {
      it('renvoie 400 quand le champ email est pas bon', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test', structure: Core.Structure.MILO }]
        }

        // When - Then
        await request(app.getHttpServer())
          .delete('/support/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie 400 quand le superviseur est incomplet', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test@octo.com' }]
        }

        // When - Then
        await request(app.getHttpServer())
          .delete('/support/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/conseillers/superviseurs')
  })
})
