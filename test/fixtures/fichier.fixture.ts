import { Authentification } from 'src/domain/authentification'
import { Readable } from 'stream'
import { Fichier, FichierMetadata } from '../../src/domain/fichier'
import { uneDate } from './date.fixture'

export const unFichier = (args: Partial<Fichier> = {}): Fichier => {
  const defaults = {
    id: '640c1e15-f2dc-4944-8d82-bc421a3c92db',
    buffer: Buffer.alloc(1),
    mimeType: 'jpg',
    nom: 'fichier-test.jpg',
    idsJeunes: ['1'],
    dateCreation: uneDate(),
    idCreateur: '1',
    typeCreateur: Authentification.Type.CONSEILLER,
    idMessage: 'id-message'
  }
  return { ...defaults, ...args }
}

export const unFichierACreer = (
  args: Partial<Fichier.ACreer> = {}
): Fichier.ACreer => {
  const defaults = {
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
    },
    idMessage: 'id-message'
  }
  return { ...defaults, ...args }
}

export const unFichierMetadata = (
  args: Partial<FichierMetadata> = {}
): FichierMetadata => {
  const defaults = {
    id: '640c1e15-f2dc-4944-8d82-bc421a3c92db',
    mimeType: 'jpg',
    nom: 'fichier-test.jpg',
    idsJeunes: ['1'],
    dateCreation: uneDate(),
    idCreateur: '1',
    typeCreateur: Authentification.Type.CONSEILLER,
    idMessage: 'id-message'
  }
  return { ...defaults, ...args }
}

export const uneImage = (): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'image.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from(bufferData),
  size: 788,
  filename: '',
  stream: Readable.from(bufferData),
  path: '',
  destination: ''
})

export const unFichierImage = (): Fichier => ({
  nom: 'image.jpg',
  mimeType: 'image/jpeg',
  buffer: Buffer.from(bufferData),
  dateCreation: uneDate(),
  idsJeunes: ['aa'],
  id: '640c1e15-f2dc-4944-8d82-bc421a3c92db',
  idCreateur: '1',
  typeCreateur: Authentification.Type.CONSEILLER,
  idMessage: 'id-message'
})

const bufferData = [
  255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 72, 0, 72, 0, 0,
  255, 225, 0, 88, 69, 120, 105, 102, 0, 0, 77, 77, 0, 42, 0, 0, 0, 8, 0, 2, 1,
  18, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 135, 105, 0, 4, 0, 0, 0, 1, 0, 0, 0, 38, 0,
  0, 0, 0, 0, 3, 160, 1, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 160, 2, 0, 4, 0, 0, 0, 1,
  0, 0, 0, 1, 160, 3, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 255, 237, 0, 56,
  80, 104, 111, 116, 111, 115, 104, 111, 112, 32, 51, 46, 48, 0, 56, 66, 73, 77,
  4, 4, 0, 0, 0, 0, 0, 0, 56, 66, 73, 77, 4, 37, 0, 0, 0, 0, 0, 16, 212, 29,
  140, 217, 143, 0, 178, 4, 233, 128, 9, 152, 236, 248, 66, 126, 255, 192, 0,
  17, 8, 0, 1, 0, 1, 3, 1, 34, 0, 2, 17, 1, 3, 17, 1, 255, 196, 0, 31, 0, 0, 1,
  5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 255, 196, 0, 181, 16, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125, 1,
  2, 3, 0, 4, 17, 5, 18, 33, 49, 65, 6, 19, 81, 97, 7, 34, 113, 20, 50, 129,
  145, 161, 8, 35, 66, 177, 193, 21, 82, 209, 240, 36, 51, 98, 114, 130, 9, 10,
  22, 23, 24, 25, 26, 37, 38, 39, 40, 41, 42, 52, 53, 54, 55, 56, 57, 58, 67,
  68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100, 101, 102,
  103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 131, 132, 133,
  134, 135, 136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162,
  163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182, 183, 184,
  185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212, 213,
  214, 215, 216, 217, 218, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234,
  241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 255, 196, 0, 31, 1, 0, 3, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  255, 196, 0, 181, 17, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119, 0, 1,
  2, 3, 17, 4, 5, 33, 49, 6, 18, 65, 81, 7, 97, 113, 19, 34, 50, 129, 8, 20, 66,
  145, 161, 177, 193, 9, 35, 51, 82, 240, 21, 98, 114, 209, 10, 22, 36, 52, 225,
  37, 241, 23, 24, 25, 26, 38, 39, 40, 41, 42, 53, 54, 55, 56, 57, 58, 67, 68,
  69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100, 101, 102,
  103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 130, 131, 132,
  133, 134, 135, 136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154,
  162, 163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182, 183,
  184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212,
  213, 214, 215, 216, 217, 218, 226, 227, 228, 229, 230, 231, 232, 233, 234,
  242, 243, 244, 245, 246, 247, 248, 249, 250, 255, 219, 0, 67, 0, 1, 1, 1, 1,
  1, 1, 2, 1, 1, 2, 3, 2, 2, 2, 3, 4, 3, 3, 3, 3, 4, 6, 4, 4, 4, 4, 4, 6, 7, 6,
  6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 11,
  11, 11, 11, 11, 11, 11, 11, 11, 11, 255, 219, 0, 67, 1, 2, 2, 2, 3, 3, 3, 5,
  3, 3, 5, 11, 8, 6, 8, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
  11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
  11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 255, 221,
  0, 4, 0, 1, 255, 218, 0, 12, 3, 1, 0, 2, 17, 3, 17, 0, 63, 0, 252, 239, 162,
  138, 43, 250, 176, 252, 92, 255, 217
]
