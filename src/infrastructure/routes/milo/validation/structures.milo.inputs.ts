import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from 'class-validator'

export class GetJeunesStructureMiloQueryParams {
  @ApiProperty({ description: 'applique une pagination aux résultats' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number

  @ApiProperty({
    description: 'si pagination appliquée, par défaut à 10 résultats'
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @ApiProperty({
    description: 'critère de recherche par nom et prénom de bénéficiaire'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  q?: string
}

export class ClotureAnimationCollectivePayload {
  @ApiProperty()
  @IsArray()
  idsJeunes: string[]
}
