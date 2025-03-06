import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddCandidatureOffreServiceCiviqueCommand,
  AddCandidatureOffreServiceCiviqueCommandHandler
} from '../../../src/application/commands/add-candidature-offre-service-civique.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import Utilisateur = Authentification.Utilisateur

describe('AddCandidatureOffreServiceCiviqueCommandHandler', () => {
  let offresServiceCiviqueRepository: StubbedType<Offre.Favori.ServiceCivique.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addCandidatureOffreServiceCiviqueCommandHandler: AddCandidatureOffreServiceCiviqueCommandHandler
  let dateService: StubbedClass<DateService>
  const beneficiaire = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresServiceCiviqueRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    addCandidatureOffreServiceCiviqueCommandHandler =
      new AddCandidatureOffreServiceCiviqueCommandHandler(
        offresServiceCiviqueRepository,
        jeuneAuthorizer,
        dateService
      )
  })

  describe('handle', () => {
    it('modifie un favori', async () => {
      // Given
      const now = DateTime.now()
      const offreServiceCivique = uneOffreServiceCivique()
      const command: AddCandidatureOffreServiceCiviqueCommand = {
        idBeneficiaire: beneficiaire.id,
        idOffre: offreServiceCivique.id
      }
      const favori = {
        idBeneficiaire: beneficiaire.id,
        dateCreation: now.minus({ day: 1 }),
        offre: offreServiceCivique
      }
      offresServiceCiviqueRepository.get
        .withArgs(beneficiaire.id, offreServiceCivique.id)
        .resolves(favori)
      dateService.now.returns(now)

      // When
      await addCandidatureOffreServiceCiviqueCommandHandler.handle(command)

      // Then
      expect(offresServiceCiviqueRepository.save).to.have.been.calledWith({
        ...favori,
        dateCandidature: now
      })
    })

    it('renvoie une failure NonTrouve quand le beneficiaire n’a pas ce favori', async () => {
      // Given
      const command: AddCandidatureOffreServiceCiviqueCommand = {
        idBeneficiaire: beneficiaire.id,
        idOffre: 'id-offre'
      }
      offresServiceCiviqueRepository.get
        .withArgs(beneficiaire.id, 'id-offre')
        .resolves(undefined)

      // When
      const result =
        await addCandidatureOffreServiceCiviqueCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(
        failure(
          new NonTrouveError(
            'Favori',
            'pour l’offre de service civique id-offre'
          )
        )
      )
    })
  })

  describe('authorize', () => {
    it('authorize le beneficiaire', async () => {
      // Given
      const command: AddCandidatureOffreServiceCiviqueCommand = {
        idBeneficiaire: 'idJeune',
        idOffre: 'id-offre'
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addCandidatureOffreServiceCiviqueCommandHandler.authorize(
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
})
