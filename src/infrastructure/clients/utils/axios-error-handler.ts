import { Logger } from '@nestjs/common'
import { AxiosError } from '@nestjs/terminus/dist/errors/axios.error'
import { ErreurHttp } from '../../../building-blocks/types/domain-error'
import { failure, Failure } from '../../../building-blocks/types/result'
import { buildError } from '../../../utils/logger.module'

export function handleAxiosError(
  error: AxiosError,
  logger: Logger,
  message: string,
  throwErrorStatusCode?: number
): Failure {
  logger.error(buildError(message, error))

  const MIN_STATUS = 400
  const MAX_STATUS = throwErrorStatusCode ?? 500
  if (
    error.response?.status >= MIN_STATUS &&
    error.response?.status < MAX_STATUS
  ) {
    const erreurHttp = new ErreurHttp(
      error.response?.data?.message ?? message,
      error.response.status
    )
    return failure(erreurHttp)
  }
  throw error
}
