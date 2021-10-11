from initialize_db import db


class SqlJeune(db.Model):
    __tablename__ = 'jeune'
    id = db.Column(db.String(255), primary_key=True)
    firstName = db.Column(db.String(255), name='first_name')
    lastName = db.Column(db.String(255), name='last_name')
    creationDate = db.Column(db.TIMESTAMP, name='creation_date', nullable=True)
    firebaseToken = db.Column(db.String(255), name='firebase_token', nullable=True)
    tokenLastUpdate = db.Column(db.TIMESTAMP, name='token_last_update', nullable=True)
    conseillerId = db.Column(db.Integer, db.ForeignKey('conseiller.id'), name='conseiller_id')
    conseiller = db.relationship('SqlConseiller', backref=db.backref('jeune_conseiller', lazy=False))
