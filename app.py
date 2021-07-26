from flask import Flask

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository

action_repository = ActionRepository(ActionDatasource())
jeune_repository = JeuneRepository(JeuneDatasource(), action_repository)
app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home(jeune_id: str):
    jeune_repository.initialize_jeune_if_required(jeune_id)
    jeune = jeune_repository.get_jeune(jeune_id)
    actions = action_repository.get_actions(jeune)
    return str(actions)


if __name__ == '__main__':
    app.run()
