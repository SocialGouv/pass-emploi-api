from datetime import datetime

from flask import Flask

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
from firebase.firebase_chat import FirebaseChat
from json_model.json_transformer import to_json
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.home_conseiller import HomeConseiller
from use_cases.home_jeune import HomeJeune

action_datasource = ActionDatasource()
jeune_datasource = JeuneDatasource()
action_repository = ActionRepository(action_datasource)
jeune_repository = JeuneRepository(jeune_datasource, action_repository, FirebaseChat())
home_jeune = HomeJeune(jeune_repository, action_repository)
conseiller_home = HomeConseiller(jeune_repository, action_repository)

app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home(jeune_id: str):
    home = home_jeune.get_home(jeune_id)
    return to_json(home), 200


@app.route('/actions/<action_id>', methods=['PUT'])
def put_home_action(action_id: str):
    home_jeune.change_action_status(int(action_id))
    return '', 200


# put -> pas besoin de l'id du jeune
# get -> des actions yes, jeune ?
# trier les actions par ordre


@app.route('/actions/<jeune_id>', methods=['POST'])
def post_home_action(jeune_id: str):
    test = {'id': 1, 'content': 'blabla', 'isDone': False, 'creationDate': datetime.now(),
            'lastUpdate': datetime.now()}
    home = conseiller_home.post_action(test, jeune_id)
    return to_json(home), 201


if __name__ == '__main__':
    app.run()
