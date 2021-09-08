from waitress import serve

from initialize_app import app, IS_DEV
from initialize_db import run_migrations
from routes.common_routes import common_routes
from routes.mobile import mobile
from routes.web import web

app.register_blueprint(web)
app.register_blueprint(mobile)
app.register_blueprint(common_routes)


@app.route('/')
def health_check():
    return 'Pass Emploi version bêta.'


@app.before_first_request
def initialize():
    run_migrations()


if __name__ == '__main__':
    if IS_DEV:
        app.run(debug=True, use_reloader=False)
    else:
        serve(app)
