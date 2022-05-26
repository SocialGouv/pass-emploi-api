import { ForbiddenException } from '@nestjs/common'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'

export function handleError(error: Error): void {
  if (error instanceof DroitsInsuffisants) {
    throw new ForbiddenException(error, error.message)
  }
  throw error
}
