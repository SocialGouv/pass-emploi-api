import os

from dotenv import load_dotenv
from flask import Flask, request, abort, jsonify
from flask_cors import cross_origin

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from datasources.rendezvous_datasource import RendezvousDatasource
from firebase.firebase_chat import FirebaseChat
from json_model.json_action import JsonAction
from json_model.json_jeune import JsonJeune
from json_model.json_rendezvous import JsonRendezvous
from json_model.json_transformer import to_json
from repositories.action_repository import ActionRepository
from repositories.conseiller_repository import ConseillerRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from use_cases.action_use_case import ActionUseCase
from use_cases.conseiller_use_case import ConseillerUseCase
from use_cases.create_action_request import CreateActionRequest
from use_cases.create_jeune_request import CreateJeuneRequest
from use_cases.create_rendezvous_request import CreateRendezvousRequest
from use_cases.home_conseiller_use_case import HomeConseillerUseCase
from use_cases.home_jeune_use_case import HomeJeuneUseCase
from use_cases.jeune_use_case import JeuneUseCase
from use_cases.rendezvous_use_case import RendezvousUseCase


app = Flask(__name__)

with app.app_context():
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    debug_mode = True if environment == 'development' else False
    print('---------------------')
    print('+++++++++++++++++++++')
    firebase_chat = FirebaseChat()

    action_datasource = ActionDatasource()
    jeune_datasource = JeuneDatasource()
    rendezvous_datasource = RendezvousDatasource()
    action_repository = ActionRepository(action_datasource)

    jeune_repository = JeuneRepository(jeune_datasource, action_repository, firebase_chat)
    rendezvous_repository = RendezvousRepository(rendezvous_datasource)
    action_use_case = ActionUseCase(jeune_repository, action_repository)
    conseiller_repository = ConseillerRepository(jeune_datasource)

    conseiller_use_case = ConseillerUseCase(conseiller_repository)
    jeune_use_case = JeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    rendezvous_use_case = RendezvousUseCase(jeune_repository, rendezvous_repository)
    home_jeune_use_case = HomeJeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    home_conseiller_use_case = HomeConseillerUseCase(jeune_repository, action_repository)


@app.route('/')
def health_check():
    return 'Pass Emploi version bêta '


@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home_jeune(jeune_id: str):
    home_jeune = home_jeune_use_case.get_home(jeune_id)
    if home_jeune is not None:
        return to_json(home_jeune), 200
    else:
        abort(404)


@app.route('/jeunes/<jeune_id>/actions', methods=['GET'])
def get_actions_jeune(jeune_id: str):
    actions = action_use_case.get_actions(jeune_id)
    json_actions = list(map(lambda x: JsonAction(x).__dict__, actions))
    return jsonify(json_actions), 200


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
        jeune_use_case.create_jeune_with_default_actions_and_rendezvous(create_jeune_request)
    else:
        jeune_use_case.create_jeune(create_jeune_request)
    return '', 201


@app.route('/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    create_action_request = CreateActionRequest(request.json['comment'], request.json['content'],
                                                request.json['isDone'])
    home_conseiller_use_case.create_action(create_action_request, jeune_id)
    return '', 201


@app.route('/rendezvous', methods=['POST'])
@cross_origin()
def post_rendezvous():
    create_rendezvous_request = CreateRendezvousRequest(request.json['comment'], request.json['date'],
                                                        request.json['duration'], request.json['jeuneId'],
                                                        request.json['modality'])
    rendezvous_use_case.create_rendezvous(create_rendezvous_request)
    return '', 201


@app.route('/conseiller/rendezvous', methods=['GET'])
def get_rendezvous():
    rendezvous = rendezvous_use_case.get_conseiller_rendezvous()
    json_rendez_vous = list(map(lambda x: JsonRendezvous(x).__dict__, rendezvous))
    return jsonify(json_rendez_vous), 200


@app.route('/conseiller/jeunes/<jeune_id>/actions', methods=['GET'])
def get_home_conseiller(jeune_id: str):
    home_conseiller = home_conseiller_use_case.get_mocked_jeune_actions(
        jeune_id) if app.debug else home_conseiller_use_case.get_jeune_actions(jeune_id)
    return to_json(home_conseiller), 200


@app.route('/conseiller/jeunes', methods=['GET'])
def get_jeunes():
    jeunes = conseiller_use_case.get_jeunes()
    json_jeunes = list(map(lambda x: JsonJeune(x).__dict__, jeunes))
    return jsonify(json_jeunes), 200


if __name__ == '__main__':
    app.run(debug=debug_mode)
