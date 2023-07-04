import { TypesDemarcheQueryModel } from './types-demarche.query-model'

export class ThematiqueQueryModel {
  code: string
  libelle: string
  demarches: TypesDemarcheQueryModel[]
}
