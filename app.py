from flask import Flask, request

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from firebase.firebase_chat import FirebaseChat
from json_model.json_transformer import to_json
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.home_conseiller_use_case import HomeConseillerUseCase
from use_cases.home_jeune_use_case import HomeJeuneUseCase

action_datasource = ActionDatasource()
jeune_datasource = JeuneDatasource()
action_repository = ActionRepository(action_datasource)
jeune_repository = JeuneRepository(jeune_datasource, action_repository, FirebaseChat())
home_jeune_use_case = HomeJeuneUseCase(jeune_repository, action_repository)
home_conseiller_use_case = HomeConseillerUseCase(jeune_repository, action_repository)

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home_jeune(jeune_id: str):
    home_jeune = home_jeune_use_case.get_home(jeune_id)
    return to_json(home_jeune), 200

# TODO  trier les actions par ordre
@app.route('/actions/<action_id>', methods=['PUT'])
def put_action_jeune(action_id: str):
    home_jeune_use_case.change_action_status(int(action_id))
    return '', 200

# TODO renommer les endpoints
@app.route('/actions/jeune/<jeune_id>/web', methods=['POST'])
def post_action(jeune_id: str):
    action_data = request.json
    home_conseiller = home_conseiller_use_case.post_action_for_jeune(action_data, jeune_id)
    return to_json(home_conseiller), 201


@app.route('/actions/<action_id>/web', methods=['PUT'])
def put_action_conseiller(action_id: str):
    home_conseiller_use_case.change_action_status(int(action_id))
    return '', 200


@app.route('/jeunes/<jeune_id>/actions/web', methods=['GET'])
def get_home_conseiller(jeune_id: str):
    home_conseiller = home_conseiller_use_case.get_jeune_actions(jeune_id)
    return to_json(home_conseiller), 200


if __name__ == '__main__':
    app.run()
