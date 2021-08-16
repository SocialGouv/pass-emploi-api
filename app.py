from flask import Flask, request

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from firebase.firebase_chat import FirebaseChat
from json_model.json_transformer import to_json
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.home_conseiller_use_case import HomeConseillerUseCase
from use_cases.home_jeune_use_case import HomeJeuneUseCase
from flask_cors import cross_origin

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


@app.route('/actions/<action_id>', methods=['PATCH'])
def put_action_jeune(action_id: str):
    action_status = request.json.get('isDone')
    home_jeune_use_case.change_action_status(action_id, action_status)
    return '', 200


# TODO: rajouter le status de l'action du PUT
@app.route('/conseiller/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    action_data = request.json
    home_conseiller_use_case.post_action_for_jeune(action_data, jeune_id)
    return '', 201


@app.route('/conseiller/actions/<action_id>', methods=['PATCH'])
def put_action_conseiller(action_id: str):
    action_status = request.json.get('isDone')
    home_conseiller_use_case.change_action_status(action_id, action_status)
    return '', 200


@app.route('/conseiller/jeunes/<jeune_id>/actions', methods=['GET'])
def get_home_conseiller(jeune_id: str):
    home_conseiller = home_conseiller_use_case.get_jeune_actions(jeune_id)
    return to_json(home_conseiller), 200


if __name__ == '__main__':
    app.run()
