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

describe('SupportController', () => {
  let archiverJeuneSupportCommandHandler: StubbedClass<ArchiverJeuneSupportCommandHandler>
  let updateAgenceCommandHandler: StubbedClass<UpdateAgenceConseillerCommandHandler>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    archiverJeuneSupportCommandHandler = app.get(
      ArchiverJeuneSupportCommandHandler
    )
    updateAgenceCommandHandler = app.get(UpdateAgenceConseillerCommandHandler)
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
})
