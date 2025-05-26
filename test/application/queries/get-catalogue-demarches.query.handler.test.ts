import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'

import { GetCatalogueDemarchesQueryHandler } from 'src/application/queries/get-catalogue-demarches.query.handler'
import { Core, estFranceTravail } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'

xdescribe('GetCatalogueQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let handler: GetCatalogueDemarchesQueryHandler

  beforeEach(() => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    handler = new GetCatalogueDemarchesQueryHandler(jeuneAuthorizer)
  })

  describe('handle', () => {
    beforeEach(() => {})
    it('renvoie le catalogue au bon format', async () => {
      // Given

      // When
      const result = await handler.handle({
        accessToken: 'un token',
        structure: Core.Structure.POLE_EMPLOI_BRSA
      })

      // Then
      expect(result).to.deep.equal([
        {
          code: 'P03',
          libelle: 'Mes candidatures',
          demarches: [
            {
              codePourquoi: 'P03',
              codeQuoi: 'Q11',
              comment: [
                {
                  code: 'C11.05',
                  label: "Avec l'aide d'une personne ou d'une structure"
                }
              ],
              commentObligatoire: true,
              libellePourquoi: 'Mes candidatures',
              libelleQuoi:
                'Préparation de ses candidatures (CV, lettre de motivation, book)'
            }
          ]
        },
        {
          code: 'P02',
          libelle: 'Ma formation professionnelle',
          demarches: []
        }
      ])
    })
  })

  describe('authorize', () => {
    it('autorise un jeune pôle emploi', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await handler.authorize(
        { accessToken: 'un token', structure: utilisateur.structure },
        utilisateur
      )

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly(
        utilisateur.id,
        utilisateur,
        estFranceTravail(utilisateur.structure)
      )
    })
  })
})
