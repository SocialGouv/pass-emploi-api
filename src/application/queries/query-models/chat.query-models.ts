import { ApiProperty } from '@nestjs/swagger'

export class ChatSecretsQueryModel {
  @ApiProperty()
  token: string

  @ApiProperty()
  cle: string
}
