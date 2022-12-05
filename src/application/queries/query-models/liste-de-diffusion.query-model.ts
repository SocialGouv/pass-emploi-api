import { ApiProperty } from '@nestjs/swagger'

class BeneficiaireListeDeDiffusionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiProperty()
  estDansLePortefeuille?: boolean
}

export class ListeDeDiffusionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  dateDeCreation: Date

  @ApiProperty()
  beneficiaires: BeneficiaireListeDeDiffusionQueryModel[]
}
