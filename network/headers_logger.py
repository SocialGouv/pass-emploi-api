from flask import request

from initialize_app import app

SEPARATOR = ', '


def log_headers() -> None:
    message = get_header_log_if_exists('X-AppVersion') \
              + get_header_log_if_exists('X-Platform') \
              + get_header_log_if_exists('X-InstallationId') \
              + get_header_log_if_exists('X-CorrelationId')
    if len(message) > 0:
        app.logger.info(message)


def get_header_log_if_exists(key) -> str:
    return key + ':' + request.headers.get(key) + SEPARATOR if request.headers.get(key) else ''
