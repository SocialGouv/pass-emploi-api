import { Controller, Get } from '@nestjs/common'
import { Authentification } from '../../../src/domain/authentification'
import { Utilisateur } from '../../../src/infrastructure/decorators/authenticated.decorator'
import { Public } from '../../../src/infrastructure/decorators/public.decorator'
import {
  OidcQueryToken,
  SkipOidcAuth
} from '../../../src/infrastructure/decorators/skip-oidc-auth.decorator'

@Controller('/fake')
export class FakeController {
  @Get()
  async get(): Promise<string> {
    return '👌'
  }

  @Public()
  @Get('/public')
  async getPublic(): Promise<string> {
    return '👌'
  }

  @SkipOidcAuth()
  @Get('/skip-oidc-auth')
  async getSkipOidcAuth(): Promise<string> {
    return '👌'
  }

  @OidcQueryToken()
  @Get('/oidc-query-token')
  async getOidcQueryToken(): Promise<string> {
    return '👌'
  }

  @OidcQueryToken()
  @Get('/utilisateur')
  async getUtilisateur(
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Authentification.Utilisateur> {
    return utilisateur
  }
}
