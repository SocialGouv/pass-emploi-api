import { MauvaiseCommandeError } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { Fichier } from '../../src/domain/fichier'
import { DateService } from '../../src/utils/date-service'
import { IdService } from '../../src/utils/id-service'
import { uneDate } from '../fixtures/date.fixture'
import { unFichier, unFichierACreer } from '../fixtures/fichier.fixture'
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
    it('autorise le format pdf', () => {
      // Given
      const fichierACreer = unFichierACreer()
      fichierACreer.fichier.mimeType = 'application/pdf'

      // When
      const result = fichierFactory.creer(fichierACreer)

      // Then
      const fichier: Fichier = unFichier({ mimeType: 'application/pdf' })
      expect(result).to.deep.equal(success(fichier))
    })

    it('autorise le format jpeg', () => {
      // Given
      const fichierACreer = unFichierACreer()
      fichierACreer.fichier.mimeType = 'image/jpeg'

      // When
      const result = fichierFactory.creer(fichierACreer)

      // Then
      const fichier: Fichier = unFichier({ mimeType: 'image/jpeg' })
      expect(result).to.deep.equal(success(fichier))
    })

    it('autorise le format png', () => {
      // Given
      const fichierACreer = unFichierACreer()
      fichierACreer.fichier.mimeType = 'image/png'

      // When
      const result = fichierFactory.creer(fichierACreer)

      // Then
      const fichier: Fichier = unFichier({ mimeType: 'image/png' })
      expect(result).to.deep.equal(success(fichier))
    })

    it('autorise le format webp', () => {
      // Given
      const fichierACreer = unFichierACreer()
      fichierACreer.fichier.mimeType = 'image/webp'

      // When
      const result = fichierFactory.creer(fichierACreer)

      // Then
      const fichier: Fichier = unFichier({ mimeType: 'image/webp' })
      expect(result).to.deep.equal(success(fichier))
    })

    it('retourne une failure quand la taille du fichier est trop grande', () => {
      // When
      const fichierACreer = unFichierACreer()
      fichierACreer.fichier.size = 787878787878
      const result = fichierFactory.creer(fichierACreer)

      // Then
      expect(result).to.deep.equal(
        failure(
          new MauvaiseCommandeError('Taille du fichier supérieure à 5 Mo')
        )
      )
    })

    it('retourne une failure quand le type du fichier est invalide', () => {
      // When
      const fichierACreer = unFichierACreer()
      fichierACreer.fichier.mimeType = 'video/mpeg'
      const result = fichierFactory.creer(fichierACreer)

      // Then
      expect(result).to.deep.equal(
        failure(
          new MauvaiseCommandeError('Types acceptés : pdf, png, jpg, webp')
        )
      )
    })
  })
})
