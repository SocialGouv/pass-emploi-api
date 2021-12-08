import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return await this.checkApiKey(context)
  }

  private async checkApiKey(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest()
    const apiKeyRequest = req.header('X-API-KEY')
    if (!apiKeyRequest) {
      throw new UnauthorizedException(
        `API KEY non présent dans le header 'X-API-KEY'`
      )
    }

    const apiKey = this.configService.get('apiKeys.keycloak')

    if (apiKeyRequest === apiKey) {
      return true
    }

    throw new UnauthorizedException('API KEY non valide')
  }
}
