import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ActionQueryModel, DemarcheQueryModel } from './actions.query-model'
import { CampagneQueryModel } from './campagne.query-model'

export class JeuneHomeActionQueryModel {
  @ApiProperty({
    type: ActionQueryModel,
    isArray: true
  })
  actions: ActionQueryModel[]

  @ApiProperty({
    type: CampagneQueryModel,
    required: false
  })
  campagne?: CampagneQueryModel
}

export class JeuneHomeDemarcheQueryModel {
  @ApiProperty({
    type: DemarcheQueryModel,
    isArray: true
  })
  actions: DemarcheQueryModel[]

  @ApiProperty({
    type: CampagneQueryModel,
    required: false
  })
  campagne?: CampagneQueryModel
}

export class JeuneHomeDemarcheQueryModelV2 {
  @ApiProperty({
    type: JeuneHomeDemarcheQueryModel
  })
  resultat: JeuneHomeDemarcheQueryModel

  @ApiPropertyOptional()
  dateDerniereMiseAJour?: Date
}
