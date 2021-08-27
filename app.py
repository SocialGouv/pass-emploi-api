from initialize_app import app, IS_DEV
from routes.mobile import mobile
from routes.web import web

app.register_blueprint(web)
app.register_blueprint(mobile)


@app.route('/')
def health_check():
    return 'Pass Emploi version bêta.'


if __name__ == '__main__':
    app.run(debug=IS_DEV)
