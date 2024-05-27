import { applyDecorators } from '@nestjs/common'
import { ApiOAuth2 } from '@nestjs/swagger'
import { IDPName } from '../middlewares/swagger.middleware'

export function CustomSwaggerApiOAuth2(): MethodDecorator & ClassDecorator {
  // eslint-disable-next-line no-process-env
  if (process.env.ENVIRONMENT !== 'prod') {
    const decorators = Object.values(IDPName).map(idpName =>
      ApiOAuth2([], idpName)
    )
    return applyDecorators(...decorators)
  }
  return applyDecorators()
}
