import { ApiProperty } from '@nestjs/swagger'

export class PaginationQueryModel {
  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number

  @ApiProperty()
  total: number
}
