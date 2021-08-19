from flask import Flask, request
from flask_cors import cross_origin

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from datasources.rendezvous_datasource import RendezvousDatasource
from firebase.firebase_chat import FirebaseChat
from json_model.json_transformer import to_json
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from use_cases.action_use_case import ActionUseCase
from use_cases.create_jeune_request import CreateJeuneRequest
from use_cases.home_conseiller_use_case import HomeConseillerUseCase
from use_cases.home_jeune_use_case import HomeJeuneUseCase
from use_cases.jeune_use_case import JeuneUseCase

action_datasource = ActionDatasource()
jeune_datasource = JeuneDatasource()
rendezvous_datasource = RendezvousDatasource()
action_repository = ActionRepository(action_datasource)
jeune_repository = JeuneRepository(jeune_datasource, action_repository, FirebaseChat())
action_use_case = ActionUseCase(action_repository)
jeune_use_case = JeuneUseCase(jeune_repository, action_repository)
rendezvous_repository = RendezvousRepository(rendezvous_datasource)
home_jeune_use_case = HomeJeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
home_conseiller_use_case = HomeConseillerUseCase(jeune_repository, action_repository)

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Pass Emploi version bêta!'


#filtrer par les rdv pas encore passés:
@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home_jeune(jeune_id: str):
    home_jeune = home_jeune_use_case.get_home(jeune_id)
    return to_json(home_jeune), 200


@app.route('/actions/<action_id>', methods=['PATCH'])
@cross_origin()
def patch_action(action_id: str):
    action_status = request.json.get('isDone')
    action_use_case.change_action_status(action_id, action_status)
    return '', 200


@app.route('/jeunes', methods=['POST'])
def post_jeune():
    create_jeune_request = CreateJeuneRequest(request.json['id'], request.json['firstName'], request.json['lastName'])
    if app.debug:
        jeune_use_case.create_jeune_with_default_actions(create_jeune_request)
    else:
        jeune_use_case.create_jeune(create_jeune_request)
    return '', 201


@app.route('/conseiller/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    action_data = request.json
    home_conseiller_use_case.post_action_for_jeune(action_data, jeune_id)
    return '', 201


@app.route('/conseiller/jeunes/<jeune_id>/actions', methods=['GET'])
def get_home_conseiller(jeune_id: str):
    home_conseiller = home_conseiller_use_case.get_mocked_jeune_actions(
        jeune_id) if app.debug else home_conseiller_use_case.get_jeune_actions(jeune_id)
    return to_json(home_conseiller), 200


if __name__ == '__main__':
    app.run(debug=True)
