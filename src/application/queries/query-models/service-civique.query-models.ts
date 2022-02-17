import { ApiProperty } from '@nestjs/swagger'

export class ServiceCiviqueQueryModel {
  @ApiProperty()
  id: string
  @ApiProperty()
  domaine: string
  @ApiProperty()
  titre: string
  @ApiProperty()
  ville: string
  @ApiProperty()
  dateDeDebut: string
}
