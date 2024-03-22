import {
  EnvoyerFormulaireContactImmersionCommand,
  EnvoyerFormulaireContactImmersionCommandHandler
} from 'src/application/commands/envoyer-formulaire-contact-immersion.command.handler.db'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { ImmersionClient } from 'src/infrastructure/clients/immersion-client'
import { unUtilisateurJeune } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'
import { unMetierRomeDto } from '../../fixtures/sql-models/metier-rome.sql-model'
import { MetierRomeSqlModel } from '../../../src/infrastructure/sequelize/models/metier-rome.sql-model'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { uneOffreImmersionDtov2 } from '../../fixtures/offre-immersion.dto.fixture'

describe('EnvoyerFormulaireContactImmersionCommandHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let envoyerFormulaireContactImmersionCommandHandler: EnvoyerFormulaireContactImmersionCommandHandler
  let immersionClient: StubbedClass<ImmersionClient>
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    immersionClient = stubClass(ImmersionClient)
    evenementService = stubClass(EvenementService)
    envoyerFormulaireContactImmersionCommandHandler =
      new EnvoyerFormulaireContactImmersionCommandHandler(
        jeuneAuthorizer,
        immersionClient,
        evenementService,
        databaseForTesting.sequelize
      )
  })

  describe('handle', () => {
    describe('quand la requête est correct', () => {
      it('transmet le formulaire au format attendu par immersion', async () => {
        // Given
        const metiers = [
          unMetierRomeDto({
            id: 1,
            code: 'D1102',
            libelle: 'Boulanger',
            appellationCode: '11573'
          })
        ]

        await MetierRomeSqlModel.bulkCreate(metiers)
        const command: EnvoyerFormulaireContactImmersionCommand = {
          idJeune: 'idJeune',
          codeRome: 'D1102',
          labelRome: 'Boulanger',
          siret: 'siret',
          prenom: 'prenom',
          nom: 'nom',
          email: 'test@test.com',
          contactMode: 'EMAIL',
          message: 'test'
        }

        immersionClient.getDetailOffre
          .withArgs('siret/11573')
          .resolves(success(uneOffreImmersionDtov2()))
        immersionClient.envoyerFormulaireImmersion.resolves(emptySuccess())

        // When
        await envoyerFormulaireContactImmersionCommandHandler.handle(command)

        // Then
        expect(
          immersionClient.envoyerFormulaireImmersion
        ).to.have.been.calledOnceWithExactly({
          appellationCode: '11573',
          siret: command.siret,
          potentialBeneficiaryFirstName: command.prenom,
          potentialBeneficiaryLastName: command.nom,
          potentialBeneficiaryEmail: command.email,
          potentialBeneficiaryPhone: '0600000000',
          immersionObjective: "Découvrir un métier ou un secteur d'activité",
          contactMode: command.contactMode,
          message: command.message,
          locationId: 'locationId'
        })
      })
    })
    describe('quand la requête a échoué', () => {
      it('quand le label ne correspond a aucun appellationCode', async () => {
        // Given
        const metiers = [
          unMetierRomeDto({
            id: 1,
            code: 'D1102',
            libelle: 'Boulanger',
            appellationCode: '11573'
          })
        ]

        await MetierRomeSqlModel.bulkCreate(metiers)
        const command: EnvoyerFormulaireContactImmersionCommand = {
          idJeune: 'idJeune',
          codeRome: 'D1102',
          labelRome: 'Un label rome qui n’existe pas',
          siret: 'siret',
          prenom: 'prenom',
          nom: 'nom',
          email: 'test@test.com',
          contactMode: 'EMAIL',
          message: 'test'
        }

        immersionClient.envoyerFormulaireImmersion.resolves(emptySuccess())

        // When
        const result =
          await envoyerFormulaireContactImmersionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(
            new NonTrouveError(
              'Offre Immersion',
              'Un label rome qui n’existe pas'
            )
          )
        )
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
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
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
