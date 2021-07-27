from flask import Flask

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from json_model.json_transformer import to_json
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.home_use_case import HomeUseCase

action_datasource = ActionDatasource()
jeune_datasource = JeuneDatasource()
action_repository = ActionRepository(action_datasource)
jeune_repository = JeuneRepository(jeune_datasource, action_repository)
home_use_case = HomeUseCase(jeune_repository, action_repository)

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home(jeune_id: str):
    home = home_use_case.get_home(jeune_id)
    return to_json(home)


if __name__ == '__main__':
    app.run()
