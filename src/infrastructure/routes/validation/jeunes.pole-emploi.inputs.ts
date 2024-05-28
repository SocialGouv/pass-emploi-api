import { IsDateString, IsNotEmpty } from 'class-validator'

export class GetMonSuiviQueryParams {
  @IsNotEmpty()
  @IsDateString()
  dateDebut: string
}
