import pytest

from initialize_app import app
from initialize_routes import initialize_routes


# mocker les retours dans le test d'inté
# os.environ

@pytest.fixture(scope='session')
def client():
    with app.app_context():
        initialize_routes(app)
        with app.test_client() as client:
            yield client
