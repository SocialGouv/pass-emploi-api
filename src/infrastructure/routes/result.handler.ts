import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  CampagneExisteDejaError,
  CampagneNonActive,
  CompteDiagorienteInvalideError,
  ConseillerMiloSansStructure,
  ConseillerNonValide,
  ConseillerSansAgenceError,
  DateNonAutoriseeError,
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  EmargementIncorrect,
  ErreurHttp,
  FavoriExisteDejaError,
  JeuneMiloSansIdDossier,
  JeuneMiloSansStructure,
  JeuneNonLieALAgenceError,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  MauvaiseCommandeError,
  MaxInscritsDepasse,
  NonTraitableError,
  NonTraitableInexistantError,
  NonTrouveError,
  ReponsesCampagneInvalide,
  RessourceIndisponibleError
} from '../../building-blocks/types/domain-error'
import { Failure, isFailure, Result } from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'

export function handleResult<R>(result: Result<R>): R
export function handleResult<R, T>(result: Result<R>, mapper: (data: R) => T): T
export function handleResult<R, T>(
  result: Result<R>,
  mapper?: (data: R) => T
): R | T {
  if (isFailure(result)) handleFailure(result)
  const transform = mapper ?? ((data: R): R => data)
  return transform(result.data)
}

function handleFailure(result: Failure): never {
  switch (result.error.code) {
    case ErreurHttp.CODE:
      if (result.error instanceof ErreurHttp) {
        throw new HttpException(result.error.message, result.error.statusCode)
      }
      throw new RuntimeException(result.error.message)
    case NonTraitableError.CODE:
    case NonTraitableError.CODE_UTILISATEUR_DEJA_MILO:
    case NonTraitableError.CODE_UTILISATEUR_NOUVEAU_MILO:
    case NonTraitableError.CODE_UTILISATEUR_DEJA_PE:
    case NonTraitableError.CODE_UTILISATEUR_NOUVEAU_PE:
    case NonTraitableError.CODE_UTILISATEUR_DEJA_PE_BRSA:
    case NonTraitableError.CODE_UTILISATEUR_NOUVEAU_PE_BRSA:
    case NonTraitableInexistantError.CODE:
      throw new UnprocessableEntityException(result.error)
    case NonTrouveError.CODE:
      throw new NotFoundException(result.error.message)
    case DateNonAutoriseeError.CODE:
    case MauvaiseCommandeError.CODE:
    case ReponsesCampagneInvalide.CODE:
    case CampagneNonActive.CODE:
    case CampagneExisteDejaError.CODE:
    case JeuneNonLieALAgenceError.CODE:
    case ConseillerSansAgenceError.CODE:
    case ConseillerMiloSansStructure.CODE:
    case JeuneMiloSansStructure.CODE:
    case JeuneMiloSansIdDossier.CODE:
    case MaxInscritsDepasse.CODE:
    case EmargementIncorrect.CODE:
    case ConseillerNonValide.CODE:
      throw new BadRequestException(result.error, result.error.message)
    case RessourceIndisponibleError.CODE:
      throw new GoneException(result.error.message)
    case Action.StatutInvalide.CODE:
      throw new BadRequestException(result.error.message)
    case DroitsInsuffisants.CODE:
    case JeunePasInactifError.CODE:
    case JeuneNonLieAuConseillerError.CODE:
    case CompteDiagorienteInvalideError.CODE:
      throw new ForbiddenException(result.error.message)
    case EmailExisteDejaError.CODE:
    case DossierExisteDejaError.CODE:
    case FavoriExisteDejaError.CODE:
      throw new ConflictException(result.error.message)
    default:
      throw new RuntimeException(result.error.message)
  }
}
