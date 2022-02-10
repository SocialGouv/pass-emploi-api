import { Injectable } from '@nestjs/common'
import * as uuid from 'uuid'

@Injectable()
export class IdService {
  uuid(): string {
    return uuid.v4()
  }
}
