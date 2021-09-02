from initialize_db import db


class SqlJeune(db.Model):
    __tablename__ = 'jeune'
    id = db.Column(db.String(255), primary_key=True)
    firstName = db.Column(db.String(255), name='first_name', nullable=False)
    lastName = db.Column(db.String(255), name='last_name', nullable=False)
    conseillerId = db.Column(db.Integer, db.ForeignKey('conseiller.id'), name='conseiller_id', nullable=False)
    conseiller = db.relationship('SqlConseiller', backref=db.backref('conseiller', lazy=False))
