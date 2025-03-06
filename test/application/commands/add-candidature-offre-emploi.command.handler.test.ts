import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddCandidatureOffreEmploiCommand,
  AddCandidatureOffreEmploiCommandHandler
} from '../../../src/application/commands/add-candidature-offre-emploi.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import Utilisateur = Authentification.Utilisateur

describe('AddCandidatureOffreEmploiCommandHandler', () => {
  let offresEmploiRepository: StubbedType<Offre.Favori.Emploi.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addCandidatureOffreEmploiCommandHandler: AddCandidatureOffreEmploiCommandHandler
  let dateService: StubbedClass<DateService>
  const beneficiaire = unJeune()

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    addCandidatureOffreEmploiCommandHandler =
      new AddCandidatureOffreEmploiCommandHandler(
        offresEmploiRepository,
        jeuneAuthorizer,
        dateService
      )
  })

  describe('handle', () => {
    it('modifie un favori', async () => {
      // Given
      const now = DateTime.now()
      const offreEmploi = uneOffreEmploi()
      const command: AddCandidatureOffreEmploiCommand = {
        idBeneficiaire: beneficiaire.id,
        idOffre: offreEmploi.id
      }
      const favori = {
        idBeneficiaire: beneficiaire.id,
        dateCreation: now.minus({ day: 1 }),
        offre: offreEmploi
      }
      offresEmploiRepository.get
        .withArgs(beneficiaire.id, offreEmploi.id)
        .resolves(favori)
      dateService.now.returns(now)

      // When
      await addCandidatureOffreEmploiCommandHandler.handle(command)

      // Then
      expect(offresEmploiRepository.save).to.have.been.calledWith({
        ...favori,
        dateCandidature: now
      })
    })

    it('renvoie une failure NonTrouve quand le beneficiaire n’a pas ce favori', async () => {
      // Given
      const command: AddCandidatureOffreEmploiCommand = {
        idBeneficiaire: beneficiaire.id,
        idOffre: 'id-offre'
      }
      offresEmploiRepository.get
        .withArgs(beneficiaire.id, 'id-offre')
        .resolves(undefined)

      // When
      const result = await addCandidatureOffreEmploiCommandHandler.handle(
        command
      )

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Favori', 'pour l’offre d’emploi id-offre'))
      )
    })
  })

  describe('authorize', () => {
    it('authorize le beneficiaire', async () => {
      // Given
      const command: AddCandidatureOffreEmploiCommand = {
        idBeneficiaire: 'idJeune',
        idOffre: 'id-offre'
      }
      const utilisateur: Utilisateur = unUtilisateurJeune()

      // When
      await addCandidatureOffreEmploiCommandHandler.authorize(
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
