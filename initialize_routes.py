def initialize_routes(app):
    from infrastructure.routes.common_routes import common_routes
    from infrastructure.routes.mobile import mobile
    from infrastructure.routes.offres_emploi import offres_emploi
    from infrastructure.routes.web import web
    from infrastructure.routes.health_check import health_check

    app.register_blueprint(health_check)
    app.register_blueprint(web)
    app.register_blueprint(mobile)
    app.register_blueprint(common_routes)
    app.register_blueprint(offres_emploi)
