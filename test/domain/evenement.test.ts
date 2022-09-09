import { Evenement, EvenementService } from '../../src/domain/evenement'
import { DateService } from '../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect, StubbedClass, stubClass } from '../utils'
import { uneDate } from '../fixtures/date.fixture'
import { unUtilisateurJeune } from '../fixtures/authentification.fixture'
import { createSandbox } from 'sinon'

describe('Evenements', () => {
  let evenementService: EvenementService
  let evenementRepository: StubbedType<Evenement.Repository>
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    evenementRepository = stubInterface(createSandbox())
    dateService = stubClass(DateService)
    evenementService = new EvenementService(evenementRepository, dateService)
  })

  describe('creer', () => {
    it('sauvegarde un événement avec les bons attributs', () => {
      // Given
      dateService.nowJs.returns(uneDate())
      const utilisateur = unUtilisateurJeune()

      // When
      evenementService.creer(Evenement.Code.ACTION_STATUT_MODIFIE, utilisateur)

      // Then
      const evenement: Evenement = {
        categorie: 'Action',
        action: 'Modification',
        nom: 'Statut',
        date: uneDate(),
        code: Evenement.Code.ACTION_STATUT_MODIFIE,
        utilisateur
      }
      expect(evenementRepository.save).to.have.been.calledWithExactly(evenement)
    })
  })
})
