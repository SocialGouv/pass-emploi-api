from requests.models import Response


def get_response_json(response: Response, error_message: str = '') -> dict:
    if response.status_code in [200, 206] and response.content:
        return response.json()
    if response.status_code == 204 or not response.content:
        return {}

    if response.status_code == 400:
        print(f'Error {response.status_code} : {response.json().get("message")}')
    else:
        print(f'Error {response.status_code}')

    raise Exception(error_message)
