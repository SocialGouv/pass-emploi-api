import { unJeune } from '../../fixtures/jeune.fixture'
import { Action } from '../../../src/domain/action/action'
import { uneAction } from '../../fixtures/action.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('Commentaire', () => {
  let commentaireActionFactory: Action.Commentaire.Factory
  let dateService: StubbedClass<DateService>
  let idService: StubbedClass<IdService>

  beforeEach(() => {
    dateService = stubClass(DateService)
    idService = stubClass(IdService)
    commentaireActionFactory = new Action.Commentaire.Factory(
      dateService,
      idService
    )
  })

  describe('build', () => {
    it('crée un commentaire avec sa date et un id', () => {
      // Given
      const jeune = unJeune()
      const actionInitiale: Action = uneAction()
      const createur: Action.Createur = {
        id: jeune.id,
        prenom: jeune.firstName,
        nom: jeune.lastName,
        type: Action.TypeCreateur.JEUNE
      }

      dateService.now.returns(uneDatetime())
      idService.uuid.returns('47435ec2-7063-43c2-b157-7896ae240a43')

      // When
      const result = commentaireActionFactory.build(
        actionInitiale,
        'Il faut faire cette action',
        createur
      )

      // Then
      const nouveauCommentaire: Action.Commentaire = {
        id: '47435ec2-7063-43c2-b157-7896ae240a43',
        idAction: actionInitiale.id,
        createur: {
          id: jeune.id,
          prenom: jeune.firstName,
          nom: jeune.lastName,
          type: Action.TypeCreateur.JEUNE
        },
        message: 'Il faut faire cette action',
        date: uneDatetime()
      }
      expect(result).to.deep.equal(nouveauCommentaire)
    })
  })
})
