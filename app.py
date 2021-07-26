from flask import Flask

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository

action_datasource = ActionDatasource()
jeune_datasource = JeuneDatasource()
action_repository = ActionRepository(action_datasource)
jeune_repository = JeuneRepository(jeune_datasource, action_repository)

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home(jeune_id: str):
    jeune_repository.initialize_jeune_if_required(jeune_id)
    jeune = jeune_repository.get_jeune(jeune_id)
    actions = action_repository.get_actions(jeune)
    return str([action.__dict__ for action in actions])


if __name__ == '__main__':
    app.run()
