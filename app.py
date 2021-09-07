from logging.config import dictConfig

from initialize_app import app
from initialize_db import run_migrations
from routes.common_routes import common_routes
from routes.mobile import mobile
from routes.web import web

dictConfig(
    {
        'version': 1,
        'root': {'level': 'DEBUG'}
    }
)
run_migrations()
app.logger.info('>>>>>> AFTER run_migrations()')
app.register_blueprint(web)
app.register_blueprint(mobile)
app.register_blueprint(common_routes)


@app.route('/')
def health_check():
    return 'Pass Emploi version bêta.'


if __name__ == '__main__':
    # app.run(debug=IS_DEV)
    from waitress import serve

    serve(app)
