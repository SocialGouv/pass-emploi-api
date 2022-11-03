import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  CampagneExisteDejaError,
  CampagneNonActive,
  ConseillerSansAgenceError,
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  ErreurHttp,
  JeuneNonLieALAgenceError,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  NonTrouveError,
  ReponsesCampagneInvalide,
  RessourceIndisponibleError,
  TokenJeuneInvalide
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
      case TokenJeuneInvalide.CODE:
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Unauthorized',
          code: 'token_pole_emploi_expired'
        })
      case NonTrouveError.CODE:
        throw new NotFoundException(result.error.message)
      case MauvaiseCommandeError.CODE:
      case ReponsesCampagneInvalide.CODE:
      case CampagneNonActive.CODE:
      case CampagneExisteDejaError.CODE:
      case JeuneNonLieALAgenceError.CODE:
      case ConseillerSansAgenceError.CODE:
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
