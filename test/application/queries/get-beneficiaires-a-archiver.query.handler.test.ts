import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetBeneficiairesAArchiverQueryHandler } from 'src/application/queries/get-beneficiaires-a-archiver.query.handler'
import { GetBeneficiairesAArchiverQueryGetter } from 'src/application/queries/query-getters/get-beneficiaires-a-archiver.query.getter.db'
import { success } from 'src/building-blocks/types/result'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'

describe('GetBeneficiaireAArchiverQueryHandler', () => {
  let conseillerAuthorizer: ConseillerAuthorizer
  let queryGetter: StubbedClass<GetBeneficiairesAArchiverQueryGetter>
  let queryHandler: GetBeneficiairesAArchiverQueryHandler
  beforeEach(async () => {
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    queryGetter = stubClass(GetBeneficiairesAArchiverQueryGetter)
    queryHandler = new GetBeneficiairesAArchiverQueryHandler(
      conseillerAuthorizer,
      queryGetter
    )
  })

  describe('handle', () => {
    it('recupère les bénéficiaires à archiver', async () => {
      // Given
      queryGetter.handle.resolves(
        success([{ id: 'id-jeune-3', nom: 'Liskov', prenom: 'Barbara' }])
      )

      // When
      const actual = await queryHandler.handle({
        idConseiller: 'id-conseiller'
      })

      // Then
      expect(queryGetter.handle).to.have.been.calledOnceWithExactly(
        'id-conseiller'
      )
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-3', nom: 'Liskov', prenom: 'Barbara' }])
      )
    })
  })

  describe('authorize', () => {
    it('appelle l’authorizer pour le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      // When
      await queryHandler.authorize(
        { idConseiller: 'id-conseiller' },
        utilisateur
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly('id-conseiller', utilisateur)
    })
  })
})
