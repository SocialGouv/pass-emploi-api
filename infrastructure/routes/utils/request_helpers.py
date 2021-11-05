from typing import Optional


def get_query_param(
        request, param_name: str, default_value: Optional = None, required: bool = False
) -> Optional:
    if not request or not request.args:
        raise ValueError('Request error')

    param_value = request.args.get(f'{param_name}')

    if not param_value:
        if required:
            raise ValueError(f'Query param {param_name} is required')
        else:
            return default_value

    return param_value

# def get_int_query_param(
#         request, param_name: str, default_value: Optional[int] = None, required: bool = False
# ) -> Optional[int]:
