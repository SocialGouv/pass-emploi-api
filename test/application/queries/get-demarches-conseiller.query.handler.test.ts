import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { GetDemarchesConseillerQueryHandler } from 'src/application/queries/get-demarches-conseiller.query.handler'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { GetDemarchesQueryGetter } from '../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { Authentification } from '../../../src/domain/authentification'
import { estPoleEmploi } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client.db'
import { SinonSandbox } from 'sinon'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { success } from '../../../src/building-blocks/types/result'

describe('GetDemarchesConseillerQueryHandler', () => {
  let authorizer: StubbedClass<ConseillerAuthorizer>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getDemarchesConseillerQueryHandler: GetDemarchesConseillerQueryHandler
  let authRepo: StubbedType<Authentification.Repository>
  let keycloakClient: StubbedClass<KeycloakClient>

  before(() => {
    const sandbox: SinonSandbox = createSandbox()
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    authorizer = stubClass(ConseillerAuthorizer)
    keycloakClient = stubClass(KeycloakClient)
    authRepo = stubInterface(sandbox)

    getDemarchesConseillerQueryHandler = new GetDemarchesConseillerQueryHandler(
      getDemarchesQueryGetter,
      authorizer,
      keycloakClient,
      authRepo
    )
  })

  describe('handle', () => {
    it('retourne le résultat du DemarcheQueryGetter', async () => {
      // Given
      const utilisateurJeune = unUtilisateurJeune()
      authRepo.getJeuneById.resolves(utilisateurJeune)
      const unTokenJeune = 'unTokenJeune'
      keycloakClient.exchangeTokenConseillerJeune.resolves(unTokenJeune)
      const query = {
        idConseiller: 'idConseiller',
        idJeune: utilisateurJeune.id,
        accessToken: 'token'
      }

      getDemarchesQueryGetter.handle.resolves(
        success({ queryModel: [uneDemarcheQueryModel()] })
      )

      // When
      const result = await getDemarchesConseillerQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        success({
          queryModel: [uneDemarcheQueryModel()],
          dateDuCache: undefined
        })
      )
      expect(authRepo.getJeuneById).to.have.been.calledOnceWithExactly(
        utilisateurJeune.id
      )
      expect(
        keycloakClient.exchangeTokenConseillerJeune
      ).to.have.been.calledOnceWithExactly(
        'token',
        utilisateurJeune.idAuthentification
      )
      expect(getDemarchesQueryGetter.handle).to.have.been.calledOnceWithExactly(
        {
          idJeune: utilisateurJeune.id,
          accessToken: 'token',
          tri: GetDemarchesQueryGetter.Tri.parSatutEtDateFin,
          idpToken: unTokenJeune,
          dateDebut: undefined
        }
      )
    })
  })

  describe('authorize', () => {
    it('authorise le conseiller pour son jeune', async () => {
      // Given
      const query = {
        idConseiller: 'ABCDE',
        idJeune: 'ABCDE',
        accessToken: 'token'
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await getDemarchesConseillerQueryHandler.authorize(query, utilisateur)
      // Then
      expect(
        authorizer.autoriserLeConseillerPourSonJeune
      ).to.have.been.calledWithExactly(
        query.idConseiller,
        query.idJeune,
        utilisateur,
        estPoleEmploi(utilisateur.structure)
      )
    })
  })
})
