import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  createRemoteJWKSet,
  errors,
  JWTPayload,
  jwtVerify,
  JWTVerifyGetKey
} from 'jose'
import { Issuer } from 'openid-client'

export interface IJwtService {
  verifyTokenAndGetJwt(token: string): Promise<JWTPayload>
}

@Injectable()
export class JwtService implements IJwtService {
  private cacheJWKS: JWTVerifyGetKey | undefined

  constructor(private configService: ConfigService) {}

  async verifyTokenAndGetJwt(token: string): Promise<JWTPayload> {
    try {
      return await this.verifyTokenAndGetJwtWithoutRetry(token)
    } catch (error) {
      if (error instanceof errors.JWKSNoMatchingKey) {
        this.cacheJWKS = undefined
        return this.verifyTokenAndGetJwtWithoutRetry(token)
      }
      throw error
    }
  }

  private async verifyTokenAndGetJwtWithoutRetry(
    token: string
  ): Promise<JWTPayload> {
    const JWKS = await this.getJWKS()
    const { payload } = await jwtVerify(token, JWKS)
    return payload
  }

  private async getJWKS(): Promise<JWTVerifyGetKey> {
    if (!this.cacheJWKS) {
      const issuer = await Issuer.discover(
        this.configService.get('oidcSSO.issuerUrl')!
      )
      this.cacheJWKS = createRemoteJWKSet(
        new URL(new URL(issuer.metadata.jwks_uri!))
      )
    }
    return this.cacheJWKS
  }
}
