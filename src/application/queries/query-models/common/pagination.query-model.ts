import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'

export class PaginationQueryModel {
  @ApiProperty()
  @IsNumber()
  page: number

  @ApiProperty()
  @IsNumber()
  limit: number

  @ApiProperty()
  @IsNumber()
  total: number
}
