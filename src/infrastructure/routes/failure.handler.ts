import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  NotFoundException
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  ErreurHttp,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  NonTrouveError,
  RessourceIndisponibleError
} from '../../building-blocks/types/domain-error'
import { isFailure, Result } from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'

export function handleFailure(result: Result): void {
  if (isFailure(result)) {
    switch (result.error.code) {
      case ErreurHttp.CODE:
        if (result.error instanceof ErreurHttp) {
          throw new HttpException(result.error.message, result.error.statusCode)
        }
        throw new RuntimeException(result.error.message)
      case NonTrouveError.CODE:
        throw new NotFoundException(result.error.message)
      case MauvaiseCommandeError.CODE:
        throw new BadRequestException(result.error, result.error.message)
      case RessourceIndisponibleError.CODE:
        throw new GoneException(result.error.message)
      case Action.StatutInvalide.CODE:
        throw new BadRequestException(result.error.message)
      case DroitsInsuffisants.CODE:
      case JeunePasInactifError.CODE:
      case JeuneNonLieAuConseillerError.CODE:
        throw new ForbiddenException(result.error.message)
      case EmailExisteDejaError.CODE:
      case DossierExisteDejaError.CODE:
        throw new ConflictException(result.error.message)
      default:
        throw new RuntimeException(result.error.message)
    }
  }
}
