import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator'

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
