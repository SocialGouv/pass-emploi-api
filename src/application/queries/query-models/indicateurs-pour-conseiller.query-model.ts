import { ApiProperty } from '@nestjs/swagger'

export class IndicateursPourConseillerQueryModel {
  @ApiProperty()
  actions: {
    creees: number
    enRetard: number
    terminees: number
  }

  @ApiProperty()
  rendezVous: {
    planifies: number
  }

  @ApiProperty()
  offres: {
    sauvegardees: number
    postulees: number
  }
}
