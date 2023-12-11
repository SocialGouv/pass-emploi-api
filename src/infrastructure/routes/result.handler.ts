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
  DateNonAutoriseeError,
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  EmargementIncorrect,
  ErreurHttp,
  JeuneMiloSansIdDossier,
  JeuneMiloSansStructure,
  JeuneNonLieALaStructureMiloError,
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
import {
  Result,
  isFailure,
  isSuccess
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'

export function handleFailure(result: Result): void {
  if (isFailure(result)) {
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
      case JeuneNonLieALaStructureMiloError.CODE:
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
        throw new ConflictException(result.error.message)
      default:
        throw new RuntimeException(result.error.message)
    }
  }
}

export function handleResult<T>(result: Result<T>): T {
  if (isSuccess(result)) {
    return result.data
  }
  throw handleFailure(result)
}
