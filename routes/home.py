from flask import app

@app.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home(jeune_id: str):
    return 'Hello World!'

