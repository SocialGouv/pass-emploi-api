import { ConfigService } from '@nestjs/config'
import { Mail } from 'src/domain/mail'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { Core } from '../../src/domain/core'

describe('Mail', () => {
  describe('Factory', () => {
    let mailFactory: Mail.Factory
    let configService: StubbedClass<ConfigService>

    beforeEach(() => {
      configService = stubClass(ConfigService)
      configService.get.returns({
        templates: {
          conversationsNonLues: '10',
          nouveauRendezvous: '11',
          suppressionJeuneMilo: '12',
          suppressionBeneficiairePassEmploi: '469',
          suppressionJeunePE: '13'
        }
      })
      mailFactory = new Mail.Factory(configService)
    })

    describe('creerMailSuppressionJeune', () => {
      describe("Quand c'est un jeune MILO", () => {
        it('crée une action avec le statut fourni', async () => {
          // Given
          const jeune = unJeune()

          // When
          const actual = mailFactory.creerMailSuppressionJeune(jeune)

          // Then
          expect(actual.params).to.deep.equal({
            prenom: jeune.firstName,
            nom: jeune.lastName
          })
          expect(actual.templateId).to.equal(12)
        })
      })
      describe("Quand c'est un bénéficiaire Pass Emploi", () => {
        it('crée une action avec le statut fourni', async () => {
          // Given
          const jeune = unJeune({ structure: Core.Structure.POLE_EMPLOI_BRSA })

          // When
          const actual = mailFactory.creerMailSuppressionJeune(jeune)

          // Then
          expect(actual.params).to.deep.equal({
            prenom: jeune.firstName,
            nom: jeune.lastName
          })
          expect(actual.templateId).to.equal(469)
        })
      })
    })
  })
})
