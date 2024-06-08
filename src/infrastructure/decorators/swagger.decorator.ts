import { applyDecorators } from '@nestjs/common'
import { ApiOAuth2 } from '@nestjs/swagger'
import { IDPName } from '../middlewares/swagger.middleware'

export function CustomSwaggerApiOAuth2(): MethodDecorator & ClassDecorator {
  const decorators = Object.values(IDPName).map(idpName =>
    ApiOAuth2([], idpName)
  )
  return applyDecorators(...decorators)
}
