from waitress import serve

from config import DEBUG
from initialize_app import app
from initialize_db import run_migrations
from initialize_routes import initialize_routes
from sandbox.create_sandbox import create_sandbox

run_migrations()

if DEBUG:
    create_sandbox()

initialize_routes(app)


if __name__ == '__main__':
    if DEBUG:
        app.run(debug=True, use_reloader=False)
    else:
        serve(app)
