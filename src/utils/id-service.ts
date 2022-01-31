import { Injectable } from '@nestjs/common'
import * as uuid from 'uuid'

@Injectable()
export class IdService {
  uuid(): string {
    return uuid.v4()
  }

  // TODO: à supprimer
  generate(longueur = 5): string {
    let result = ''
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    for (let i = 0; i < longueur; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }
}
