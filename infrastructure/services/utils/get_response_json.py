VALID_RESPONSE_STATUS_CODES = [200, 206]


def get_response_json(response):
    return response.json() if response and response.status_code in VALID_RESPONSE_STATUS_CODES else None
