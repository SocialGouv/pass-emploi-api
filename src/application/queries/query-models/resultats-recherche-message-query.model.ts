import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class ResultatRechercheMatchQueryModel {
  @ApiProperty()
  match: [number, number]

  @ApiPropertyOptional()
  key?: string
}

export class MessageIndividuelQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  idConversation: string

  @ApiProperty()
  message: object

  @ApiProperty()
  matches: ResultatRechercheMatchQueryModel[]
}
export class ResultatsRechercheMessageQueryModel {
  @ApiProperty({ type: MessageIndividuelQueryModel, isArray: true })
  resultats: MessageIndividuelQueryModel[]
}
