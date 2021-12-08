import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const Authenticated = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.authenticated
  }
)
export const Utilisateur = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.authenticated?.utilisateur
  }
)
