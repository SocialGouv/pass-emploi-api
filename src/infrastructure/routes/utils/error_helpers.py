import traceback
from typing import Tuple


def handle_exception(e: Exception) -> Tuple[dict, int]:
    traceback.print_exc()

    status_code = 500

    if isinstance(e, ValueError):
        status_code = 400

    return generate_error_response(str(e), status_code)


def generate_error_response(message: str, status_code: int) -> Tuple[dict, int]:
    return {'status_code': status_code, 'message': message}, status_code
