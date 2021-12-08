import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { JWTPayload } from 'jose'
import { Authentification } from '../../domain/authentification'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { JwtService } from './jwt.service'

@Injectable()
export class OidcAuthGuard implements CanActivate {
  private logger: Logger

  constructor(private jwtService: JwtService, private reflector: Reflector) {
    this.logger = new Logger('OidcAuthGuard')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true
    }
    return await this.checkJWT(context)
  }

  private async checkJWT(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest()
    const authorization = req.header('Authorization')
    const accessToken = authorization?.replace('Bearer ', '')
    if (!accessToken) {
      throw new UnauthorizedException(
        `Access token non présent dans le header 'Authorization'`
      )
    }
    try {
      const payload: JWTPayload = await this.jwtService.verifyTokenAndGetJwt(
        accessToken
      )
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
        utilisateur: this.buildUtilisateur(payload)
      }
      return true
    } catch (error) {
      this.logger.error(error)
      throw new UnauthorizedException()
    }
  }

  private buildUtilisateur(payload: JWTPayload): Authentification.Utilisateur {
    return {
      id: payload.userId as string,
      email: payload.email as string,
      nom: payload.family_name as string,
      prenom: payload.given_name as string,
      type: payload.userType as Authentification.Type,
      structure: payload.userStructure as Authentification.Structure
    }
  }

  private isPublic(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    return isPublic
  }
}
