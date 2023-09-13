import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { Reflector } from '@nestjs/core'
import { Authentification } from '../../domain/authentification'

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.checkApiKey(context)
  }

  private async checkApiKey(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest()
    const apiKeyRequest = req.header('X-API-KEY')
    if (!apiKeyRequest) {
      throw new UnauthorizedException(
        `API KEY non présent dans le header 'X-API-KEY'`
      )
    }

    let apiKey = ''
    const partenaire = this.reflector.get<Authentification.Partenaire>(
      Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
      context.getHandler()
    )
    switch (partenaire) {
      case Authentification.Partenaire.IMMERSION:
        apiKey = this.configService.get('apiKeys.immersion')!
        break
      case Authentification.Partenaire.KEYCLOAK:
        apiKey = this.configService.get('apiKeys.keycloak')!
        break
      case Authentification.Partenaire.POLE_EMPLOI:
        apiKey = this.configService.get('apiKeys.poleEmploi')!
        break
    }

    if (apiKeyRequest === apiKey) {
      return true
    }

    throw new UnauthorizedException('API KEY non valide')
  }
}
