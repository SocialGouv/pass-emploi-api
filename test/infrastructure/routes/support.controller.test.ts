import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { ArchiverJeuneSupportCommandHandler } from '../../../src/application/commands/support/archiver-jeune-support.command.handler'
import {
  CreerSuperviseursCommand,
  CreerSuperviseursCommandHandler
} from '../../../src/application/commands/support/creer-superviseurs.command.handler'
import {
  DeleteSuperviseursCommand,
  DeleteSuperviseursCommandHandler
} from '../../../src/application/commands/support/delete-superviseurs.command.handler'
import { UpdateAgenceConseillerCommandHandler } from '../../../src/application/commands/support/update-agence-conseiller.command.handler'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from '../../../src/application/commands/transferer-jeunes-conseiller.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { StubbedClass, expect } from '../../utils'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { UpdateFeatureFlipCommandHandler } from '../../../src/application/commands/support/update-feature-flip.command.handler'
import { FeatureFlipTag } from '../../../src/infrastructure/sequelize/models/feature-flip.sql-model'

describe('SupportController', () => {
  let archiverJeuneSupportCommandHandler: StubbedClass<ArchiverJeuneSupportCommandHandler>
  let updateAgenceCommandHandler: StubbedClass<UpdateAgenceConseillerCommandHandler>
  let creerSuperviseursCommandHandler: StubbedClass<CreerSuperviseursCommandHandler>
  let deleteSuperviseursCommandHandler: StubbedClass<DeleteSuperviseursCommandHandler>
  let transfererJeunesConseillerCommandHandler: StubbedClass<TransfererJeunesConseillerCommandHandler>
  let updateFeatureFlipCommandHandler: StubbedClass<UpdateFeatureFlipCommandHandler>
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
    updateFeatureFlipCommandHandler = app.get(UpdateFeatureFlipCommandHandler)
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
          .set({ 'X-API-KEY': 'api-key-support' })
          // Then
          .expect(HttpStatus.NO_CONTENT)

        expect(
          archiverJeuneSupportCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          { idJeune },
          Authentification.unUtilisateurSupport()
        )
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
          .set({ 'X-API-KEY': 'api-key-support' })
          // Then
          .expect(HttpStatus.NOT_FOUND)

        expect(
          archiverJeuneSupportCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          { idJeune },
          Authentification.unUtilisateurSupport()
        )
      })
    })
    describe('auth', () => {
      it('fail avec mauvaise api key', async () => {
        // Given
        const idJeune = 'test'
        archiverJeuneSupportCommandHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', idJeune))
        )

        // When
        await request(app.getHttpServer())
          .post('/support/archiver-jeune/test')
          .set({ 'X-API-KEY': 'api-key-inconnue' })
          // Then
          .expect(HttpStatus.UNAUTHORIZED)
      })
    })
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
          .set({ 'X-API-KEY': 'api-key-support' })
          .send({ idConseiller, idNouvelleAgence })
          // Then
          .expect(HttpStatus.CREATED)

        expect(
          updateAgenceCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          { idConseiller, idNouvelleAgence },
          Authentification.unUtilisateurSupport()
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
          .set({ 'X-API-KEY': 'api-key-support' })
          .send({ idConseiller, idNouvelleAgence })
          // Then
          .expect(HttpStatus.NOT_FOUND)

        expect(
          updateAgenceCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          { idConseiller, idNouvelleAgence },
          Authentification.unUtilisateurSupport()
        )
      })
    })
    describe('auth', () => {
      it('fail sans api key', async () => {
        // Given
        updateAgenceCommandHandler.execute.resolves(
          failure(new NonTrouveError('Agence', 'b'))
        )

        // When
        await request(app.getHttpServer())
          .post('/support/changer-agence-conseiller')
          .set({ 'X-API-KEY': 'api-key' })
          .send({ idConseiller, idNouvelleAgence })
          // Then
          .expect(HttpStatus.UNAUTHORIZED)
      })
    })
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
          provenanceUtilisateur: Authentification.Type.SUPPORT
        }
        transfererJeunesConseillerCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post('/support/transferer-jeunes')
          .set({ 'X-API-KEY': 'api-key-support' })
          .send(payload)
          // Then
          .expect(HttpStatus.NO_CONTENT)

        expect(
          transfererJeunesConseillerCommandHandler.execute
        ).to.have.been.calledOnceWithExactly(
          command,
          Authentification.unUtilisateurSupport()
        )
      })
    })
  })

  describe('POST /support/superviseurs', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superEmailFT: undefined,
          superviseurs: [
            { email: 'test@octo.com', structure: Core.Structure.MILO }
          ]
        }

        creerSuperviseursCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post('/support/superviseurs')
          .send(command)
          .set({ 'X-API-KEY': 'api-key-support' })
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
          .set({ 'X-API-KEY': 'api-key-support' })
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
          .set({ 'X-API-KEY': 'api-key-support' })
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
  })

  describe('DELETE /support/superviseurs', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 201', async () => {
        // Given
        const command: DeleteSuperviseursCommand = {
          emails: ['test@octo.com']
        }

        deleteSuperviseursCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .delete('/support/superviseurs')
          .send(command)
          .set({ 'X-API-KEY': 'api-key-support' })
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
          .set({ 'X-API-KEY': 'api-key-support' })
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
          .set({ 'X-API-KEY': 'api-key-support' })
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
  })

  describe('POST /feature-flip', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 204', async () => {
        // Given
        const payload = {
          tagFeature: FeatureFlipTag.DEMARCHES_IA,
          emailsConseillersAjout: ['test']
        }
        const command = {
          tagFeature: FeatureFlipTag.DEMARCHES_IA,
          emailsConseillersAjout: ['test'],
          supprimerExistants: undefined
        }
        updateFeatureFlipCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())
        // When - Then
        await request(app.getHttpServer())
          .post('/support/feature-flip')
          .send(payload)
          .set({ 'X-API-KEY': 'api-key-support' })
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie 204 avec supprimerExistants à false', async () => {
        // Given
        const payload = {
          tagFeature: FeatureFlipTag.DEMARCHES_IA,
          emailsConseillersAjout: ['test'],
          supprimerExistants: false
        }
        const command = {
          tagFeature: FeatureFlipTag.DEMARCHES_IA,
          emailsConseillersAjout: ['test'],
          supprimerExistants: false
        }
        updateFeatureFlipCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())
        // When - Then
        await request(app.getHttpServer())
          .post('/support/feature-flip')
          .send(payload)
          .set({ 'X-API-KEY': 'api-key-support' })
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie 400 qd supprimerExistants est autre que true', async () => {
        // Given
        const payload = {
          tagFeature: FeatureFlipTag.DEMARCHES_IA,
          emailsConseillersAjout: ['test'],
          supprimerExistants: 'true'
        }
        // When - Then
        await request(app.getHttpServer())
          .post('/support/feature-flip')
          .send(payload)
          .set({ 'X-API-KEY': 'api-key-support' })
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
  })
})
