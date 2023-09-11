import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator'

export class EnvoyerNotificationsExternePayload {
  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({ each: true })
  idsAuthentificationBeneficiaires: string[]
}
