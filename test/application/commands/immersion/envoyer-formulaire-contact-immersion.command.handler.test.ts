import {
  EnvoyerFormulaireContactImmersionCommand,
  EnvoyerFormulaireContactImmersionCommandHandler
} from 'src/application/commands/immersion/envoyer-formulaire-contact-immersion.command.handler'
import { emptySuccess } from 'src/building-blocks/types/result'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { ImmersionClient } from 'src/infrastructure/clients/immersion-client'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'

describe('EnvoyerFormulaireContactImmersionCommandHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let envoyerFormulaireContactImmersionCommandHandler: EnvoyerFormulaireContactImmersionCommandHandler
  let immersionClient: StubbedClass<ImmersionClient>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(async () => {
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    immersionClient = stubClass(ImmersionClient)
    evenementService = stubClass(EvenementService)
    envoyerFormulaireContactImmersionCommandHandler =
      new EnvoyerFormulaireContactImmersionCommandHandler(
        jeuneAuthorizer,
        immersionClient,
        evenementService
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
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur
      )
    })
  })
  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    it("créé l'événement d'envoi formulaire", async () => {
      await envoyerFormulaireContactImmersionCommandHandler.monitor(utilisateur)

      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_IMMERSION_ENVOI_FORMULAIRE,
        utilisateur
      )
    })
  })
})
