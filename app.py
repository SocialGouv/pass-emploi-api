from waitress import serve

from initialize_app import app, DEBUG
from initialize_db import run_migrations
from sandbox.create_sandbox import create_sandbox
from infrastructure.routes.common_routes import common_routes
from infrastructure.routes.mobile import mobile
from infrastructure.routes.web import web
from infrastructure.routes.offres_emploi import offres_emploi

run_migrations()

if DEBUG:
    create_sandbox()

app.register_blueprint(web)
app.register_blueprint(mobile)
app.register_blueprint(common_routes)
app.register_blueprint(offres_emploi)


@app.route('/')
def health_check():
    return 'Pass Emploi version bêta.'


if __name__ == '__main__':
    if DEBUG:
        app.run(debug=True, use_reloader=False)
    else:
        serve(app)
