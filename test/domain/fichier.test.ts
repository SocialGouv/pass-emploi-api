import { MauvaiseCommandeError } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
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

    idService.uuid.returns('640c1e15-f2dc-4944-8d82-bc421a3c92db')
    dateService.nowJs.returns(uneDate())

    fichierFactory = new Fichier.Factory(idService, dateService)
  })

  describe('creer', () => {
    it('retourne un Fichier quand le fichier est valide', () => {
      // Given
      const fichier: Fichier = unFichier({ mimeType: 'image/jpeg' })

      // When
      const result = fichierFactory.creer({
        fichier: {
          buffer: Buffer.alloc(1),
          mimeType: 'image/jpeg',
          name: 'fichier-test.jpg',
          size: 788
        },
        jeunesIds: ['1'],
        createur: {
          id: '1',
          type: Authentification.Type.CONSEILLER
        }
      })

      // Then
      expect(result).to.deep.equal(success(fichier))
    })
    it('retourne une failure quand la taille du fichier est trop grande', () => {
      // When
      const result = fichierFactory.creer({
        fichier: {
          buffer: Buffer.alloc(1),
          mimeType: 'image/jpeg',
          name: 'fichier-test.jpg',
          size: 78909098
        },
        jeunesIds: ['1'],
        createur: {
          id: '1',
          type: Authentification.Type.CONSEILLER
        }
      })

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Taille du fichier trop grande'))
      )
    })
    it('retourne une failure quand le type du fichier est invalide', () => {
      // When
      const result = fichierFactory.creer({
        fichier: {
          buffer: Buffer.alloc(1),
          mimeType: 'video/mpeg',
          name: 'fichier-test.jpg',
          size: 789
        },
        jeunesIds: ['1'],
        createur: {
          id: '1',
          type: Authentification.Type.CONSEILLER
        }
      })

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Type du fichier non accepté'))
      )
    })
  })
})
