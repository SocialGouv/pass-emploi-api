import json


def to_json(object_list):
    json_list = list(map(lambda element: element.__dict__, object_list))
    return json.dumps(json_list)
