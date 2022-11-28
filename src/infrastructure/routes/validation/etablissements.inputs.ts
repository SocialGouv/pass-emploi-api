import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsDateString, IsNotEmpty, IsOptional } from 'class-validator'

export class GetAnimationsCollectivesQueryParams {
  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateDebut?: string

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  dateFin?: string
}

export class ClotureAnimationCollectivePayload {
  @ApiProperty()
  @IsArray()
  idsJeunes: string[]
}
