import { CustomDecorator, SetMetadata } from '@nestjs/common'

export const SKIP_OIDC_AUTH_KEY = 'skipOidcAuth'
export const SkipOidcAuth = (): CustomDecorator<string> =>
  SetMetadata(SKIP_OIDC_AUTH_KEY, true)
