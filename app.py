from waitress import serve

from initialize_app import app, DEBUG
from initialize_db import run_migrations, db
from initialize_routes import initialize_routes
from sandbox.create_sandbox import create_sandbox

run_migrations()

if DEBUG:
    create_sandbox()

initialize_routes(app)


@app.teardown_request
def remove_db_session(exc):
    db.session.remove()


if __name__ == '__main__':
    if DEBUG:
        app.run(debug=True, use_reloader=False)
    else:
        serve(app)
