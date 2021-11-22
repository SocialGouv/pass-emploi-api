import { Conseiller } from 'src/domain/conseiller'

export interface DetailConseillerQueryModel {
  id: Conseiller.Id
  firstName: string
  lastName: string
}
