import { success } from 'src/building-blocks/types/result'
import { Fichier } from '../../src/domain/fichier'
import { DateService } from '../../src/utils/date-service'
import { IdService } from '../../src/utils/id-service'
import { uneDate } from '../fixtures/date.fixture'
import { unFichier } from '../fixtures/fichier.fixture'
import { expect, stubClass } from '../utils'

describe('Fichier', () => {
  let fichierFactory: Fichier.Factory

  beforeEach(() => {
    const idService = stubClass(IdService)
    const dateService = stubClass(DateService)

    idService.uuid.returns('id-test')
    dateService.nowJs.returns(uneDate())

    fichierFactory = new Fichier.Factory(idService, dateService)
  })

  describe('creer', () => {
    describe('quand le fichier est valide', () => {
      it('retourne un Fichier', () => {
        // Given
        const fichier: Fichier = unFichier()

        // When
        const result = fichierFactory.creer({
          fichier: {
            buffer: Buffer.alloc(1),
            mimeType: 'jpg',
            name: 'fichier-test.jpg',
            size: 788
          },
          jeunesIds: ['1']
        })

        // Then
        expect(result).to.deep.equal(success(fichier))
      })
    })
  })
})
