from initialize_app import app, IS_DEV, db
from routes.common_routes import common_routes
from routes.mobile import mobile
from routes.web import web
from sql_package.sql_conseiller import SqlConseiller

app.register_blueprint(web)
app.register_blueprint(mobile)
app.register_blueprint(common_routes)


@app.route('/')
def health_check():
    conseiller = SqlConseiller(firstName='Nils', lastName='Tom')
    # TODO REMOVE
    db.session.add(conseiller)
    db.session.commit()
    users = SqlConseiller.query.all()
    for u in users:
        print(u)
    return 'Pass Emploi version bêta.'


if __name__ == '__main__':
    app.run(debug=IS_DEV)
