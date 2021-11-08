def initialize_routes(app):
    from src.infrastructure.routes.common_routes import common_routes
    from src.infrastructure.routes.mobile import mobile
    from src.infrastructure.routes.offres_emploi import offres_emploi
    from src.infrastructure.routes.web import web
    from src.infrastructure.routes.health_check import health_check

    app.register_blueprint(health_check)
    app.register_blueprint(web)
    app.register_blueprint(mobile)
    app.register_blueprint(common_routes)
    app.register_blueprint(offres_emploi)
