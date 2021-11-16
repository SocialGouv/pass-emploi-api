from flask import Blueprint

health_check = Blueprint('health_check', __name__)


@health_check.route('/')
def health_check_route():
    return 'Pass Emploi'
