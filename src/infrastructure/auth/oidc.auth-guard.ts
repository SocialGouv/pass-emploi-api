import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserObject } from 'elastic-apm-node'
import { Request } from 'express'
import { JWTPayload } from 'jose'
import { LogEvent, LogEventKey } from '../../building-blocks/types/log.event'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { SKIP_OIDC_AUTH_KEY } from '../decorators/skip-oidc-auth.decorator'
import { getAPMInstance } from '../monitoring/apm.init'
import { JwtService } from './jwt.service'

@Injectable()
export class OidcAuthGuard implements CanActivate {
  private logger: Logger

  constructor(private jwtService: JwtService, private reflector: Reflector) {
    this.logger = new Logger('OidcAuthGuard')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context) || this.isSkipOidcAuth(context)) {
      return true
    }
    return this.checkJWT(context)
  }

  private async checkJWT(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest()
    const authorization = req.header('Authorization')
    const accessToken = authorization?.replace(/bearer /gi, '')
    if (!accessToken) {
      throw new UnauthorizedException(
        `Access token non présent dans le header 'Authorization'`
      )
    }
    try {
      const payload: JWTPayload = await this.jwtService.verifyTokenAndGetJwt(
        accessToken
      )
      const utilisateur = OidcAuthGuard.buildUtilisateur(payload)
      /*
      ts-ignore accepté ici
      On ajoute un nouvel attribut à la request au runtime pour le mettre dans le context et pouvoir l'utiliser plus tard dans l'execution
        ex: recupérer l'utilisateur pour connaitre son id, verifier les droits, etc...
      Cet attribut n'existe pas dans l'objet Request
      */
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      req.authenticated = {
        accesToken: payload,
        utilisateur
      }
      const userAPM: UserObject = {
        id: utilisateur.id,
        username: `${utilisateur.prenom}-${utilisateur.nom}-${utilisateur.type}-${utilisateur.structure}`,
        email: utilisateur.email
      }
      getAPMInstance().setUserContext(userAPM)
      const event = new LogEvent(LogEventKey.USER_API_CALL, {
        user: utilisateur
      })
      this.logger.log(event)
      return true
    } catch (error) {
      this.logger.error(error)
      throw new UnauthorizedException()
    }
  }

  private static buildUtilisateur(
    payload: JWTPayload
  ): Authentification.Utilisateur {
    return {
      id: payload.userId as string,
      email: payload.email as string,
      nom: payload.family_name as string,
      prenom: payload.given_name as string,
      type: payload.userType as Authentification.Type,
      structure: payload.userStructure as Core.Structure,
      roles: getRoles(payload.userRoles as Authentification.Role[] | undefined)
    }
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
  }

  private isSkipOidcAuth(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(SKIP_OIDC_AUTH_KEY, [
      context.getHandler(),
      context.getClass()
    ])
  }
}

function getRoles(
  roles: Authentification.Role[] | undefined
): Authentification.Role[] {
  return roles ?? []
}
