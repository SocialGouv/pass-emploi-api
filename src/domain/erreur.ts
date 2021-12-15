import { NotFoundException, ForbiddenException } from '@nestjs/common'

export class NotFound extends NotFoundException {
  constructor(id: string, type: string) {
    super(`La ressource ${type} d'id ${id} n'existe pas`)
  }
}

export class Unauthorized extends ForbiddenException {
  constructor(type: string) {
    super(`La ressource ${type} n'est pas autorisée`)
  }
}
