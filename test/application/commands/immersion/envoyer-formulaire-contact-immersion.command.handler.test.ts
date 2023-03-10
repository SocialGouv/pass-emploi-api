import { JeuneAuthorizer } from 'src/application/authorizers/authorize-jeune'
import {
  EnvoyerFormulaireContactImmersionCommand,
  EnvoyerFormulaireContactImmersionCommandHandler
} from 'src/application/commands/immersion/envoyer-formulaire-contact-immersion.command.handler'
import { emptySuccess } from 'src/building-blocks/types/result'
import { ImmersionClient } from 'src/infrastructure/clients/immersion-client'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'

describe('EnvoyerFormulaireContactImmersionCommandHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let envoyerFormulaireContactImmersionCommandHandler: EnvoyerFormulaireContactImmersionCommandHandler
  let immersionClient: StubbedClass<ImmersionClient>

  beforeEach(async () => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    immersionClient = stubClass(ImmersionClient)
    envoyerFormulaireContactImmersionCommandHandler =
      new EnvoyerFormulaireContactImmersionCommandHandler(
        jeuneAuthorizer,
        immersionClient
      )
  })

  describe('handle', () => {
    it('transmet le formulaire au format attendu par immersion', async () => {
      // Given
      const command: EnvoyerFormulaireContactImmersionCommand = {
        idJeune: 'idJeune',
        codeRome: 'code rome',
        labelRome: 'label rome',
        siret: 'siret',
        prenom: 'prenom',
        nom: 'nom',
        email: 'test@test.com',
        contactMode: 'EMAIL',
        message: 'test'
      }

      immersionClient.postFormulaireImmersion.resolves(emptySuccess())

      // When
      await envoyerFormulaireContactImmersionCommandHandler.handle(command)

      // Then
      expect(
        immersionClient.postFormulaireImmersion
      ).to.have.been.calledOnceWithExactly({
        offer: {
          romeCode: command.codeRome,
          romeLabel: command.labelRome
        },
        siret: command.siret,
        potentialBeneficiaryFirstName: command.prenom,
        potentialBeneficiaryLastName: command.nom,
        potentialBeneficiaryEmail: command.email,
        contactMode: command.contactMode,
        message: command.message
      })
    })
  })

  describe('authorize', () => {
    it('authorize le jeune', async () => {
      // Given
      const command: EnvoyerFormulaireContactImmersionCommand = {
        idJeune: 'idJeune',
        codeRome: 'codeRome',
        labelRome: 'labelRome',
        siret: 'siret',
        prenom: 'prenom',
        nom: 'nom',
        email: 'email',
        contactMode: 'EMAIL',
        message: 'message'
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await envoyerFormulaireContactImmersionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.authorizeJeune).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur
      )
    })
  })
})
