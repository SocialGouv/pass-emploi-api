import { ConfigService } from '@nestjs/config'
import { Mail } from 'src/domain/mail'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'

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
          suppressionJeunePE: '13'
        }
      })
      mailFactory = new Mail.Factory(configService)
    })

    describe('creerMailSuppressionJeune', () => {
      describe("Quand c'est un conseiller MILO", () => {
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
    })
  })
})
