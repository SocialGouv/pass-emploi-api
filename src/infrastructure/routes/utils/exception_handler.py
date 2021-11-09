import traceback

from flask import abort


def handle_exception(e: Exception):
    traceback.print_exc()

    status_code = 500

    if isinstance(e, ValueError):
        status_code = 400

    abort(status_code, description=e)
