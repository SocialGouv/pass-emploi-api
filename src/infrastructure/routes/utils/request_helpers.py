from typing import Optional


def get_query_param(
        params: dict, param_name: str, default_value: Optional = None, required: bool = False
) -> Optional:
    error_message = f'Query param "{param_name}" is required'

    if required and not params:
        raise ValueError(error_message)

    param_value = params.get(param_name)

    if not param_value:
        if required:
            raise ValueError(error_message)
        else:
            return default_value

    return param_value


def get_int_query_param(
        params: dict, param_name: str, default_value: Optional[int] = None, required: bool = False
) -> Optional[int]:
    param_value = get_query_param(params, param_name, default_value, required)

    if not param_value:
        return param_value

    try:
        param_int_value = int(param_value)
        return param_int_value
    except:
        raise ValueError(f'Query param "{param_name}" must be an integer')


def get_string_query_param(
        params: dict, param_name: str, default_value: Optional[str] = None, required: bool = False
) -> Optional[str]:
    return get_query_param(params, param_name, default_value, required)
