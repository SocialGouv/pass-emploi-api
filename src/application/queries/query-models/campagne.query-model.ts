import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class OptionQuestionCampagneQueryModel {
  @ApiProperty()
  id: number

  @ApiProperty()
  libelle: string
}

export class QuestionCampagneQueryModel {
  @ApiProperty()
  id: number

  @ApiProperty()
  libelle: string

  @ApiProperty({ type: OptionQuestionCampagneQueryModel, isArray: true })
  options: OptionQuestionCampagneQueryModel[]

  @ApiProperty()
  pourquoi: boolean

  @ApiPropertyOptional()
  libellePourquoi?: string
}

export class CampagneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  dateDebut: string

  @ApiProperty()
  dateFin: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  description: string

  @ApiProperty({ type: QuestionCampagneQueryModel, isArray: true })
  questions: QuestionCampagneQueryModel[]
}
