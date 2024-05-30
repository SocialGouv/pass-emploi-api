import { ApiProperty } from '@nestjs/swagger'

export class MessageIndividuelQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  message: object

  @ApiProperty()
  matches: Array<[number, number]>
}
export class ResultatsRechercheMessageQueryModel {
  @ApiProperty({ type: MessageIndividuelQueryModel, isArray: true })
  resultats: MessageIndividuelQueryModel[]
}
