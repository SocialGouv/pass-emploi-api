import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  DroitsInsuffisants,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { isFailure, Result } from 'src/building-blocks/types/result'

export function handleFailure(result: Result): void {
  if (isFailure(result)) {
    switch (result.error.code) {
      case NonTrouveError.CODE:
        throw new NotFoundException(result.error, result.error.message)
      case MauvaiseCommandeError.CODE:
        throw new BadRequestException(result.error, result.error.message)
      case DroitsInsuffisants.CODE:
      case JeunePasInactifError.CODE:
      case JeuneNonLieAuConseillerError.CODE:
        throw new ForbiddenException(result.error, result.error.message)
      default:
        throw new RuntimeException(result.error.message)
    }
  }
}
