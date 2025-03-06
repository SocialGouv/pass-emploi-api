import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddCandidatureOffreImmersionCommand,
  AddCandidatureOffreImmersionCommandHandler
} from '../../../src/application/commands/add-candidature-offre-immersion.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unFavoriOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import Utilisateur = Authentification.Utilisateur

describe('AddCandidatureOffreImmersionCommandHandler', () => {
  let offresImmersionRepository: StubbedType<Offre.Favori.Immersion.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addCandidatureOffreImmersionCommandHandler: AddCandidatureOffreImmersionCommandHandler
  let dateService: StubbedClass<DateService>
  const beneficiaire = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    addCandidatureOffreImmersionCommandHandler =
      new AddCandidatureOffreImmersionCommandHandler(
        offresImmersionRepository,
        jeuneAuthorizer,
        dateService
      )
  })

  describe('handle', () => {
    it('modifie un favori', async () => {
      // Given
      const now = DateTime.now()
      const offreImmersion = unFavoriOffreImmersion()
      const command: AddCandidatureOffreImmersionCommand = {
        idBeneficiaire: beneficiaire.id,
        idOffre: offreImmersion.id
      }
      const favori = {
        idBeneficiaire: beneficiaire.id,
        dateCreation: now.minus({ day: 1 }),
        offre: offreImmersion
      }
      offresImmersionRepository.get
        .withArgs(beneficiaire.id, offreImmersion.id)
        .resolves(favori)
      dateService.now.returns(now)

      // When
      await addCandidatureOffreImmersionCommandHandler.handle(command)

      // Then
      expect(offresImmersionRepository.save).to.have.been.calledWith({
        ...favori,
        dateCandidature: now
      })
    })

    it('renvoie une failure NonTrouve quand le beneficiaire n’a pas ce favori', async () => {
      // Given
      const command: AddCandidatureOffreImmersionCommand = {
        idBeneficiaire: beneficiaire.id,
        idOffre: 'id-offre'
      }
      offresImmersionRepository.get
        .withArgs(beneficiaire.id, 'id-offre')
        .resolves(undefined)

      // When
      const result = await addCandidatureOffreImmersionCommandHandler.handle(
        command
      )

      // Then
      expect(result).to.deep.equal(
        failure(
          new NonTrouveError('Favori', 'pour l’offre d’immersion id-offre')
        )
      )
    })
  })

  describe('authorize', () => {
    it('authorize le beneficiaire', async () => {
      // Given
      const command: AddCandidatureOffreImmersionCommand = {
        idBeneficiaire: 'idJeune',
        idOffre: 'id-offre'
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addCandidatureOffreImmersionCommandHandler.authorize(
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
