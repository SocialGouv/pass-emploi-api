from initialize_db import db


class SqlRendezvous(db.Model):
    __tablename__ = 'rendezvous'
    id = db.Column(db.BigInteger(), primary_key=True)
    title = db.Column(db.String(512), name='title')
    subtitle = db.Column(db.String(512), name='subtitle')
    comment = db.Column(db.String(2048), name='comment')
    modality = db.Column(db.String(2048), name='modality')
    date = db.Column(db.TIMESTAMP, name='date')
    duration = db.Column(db.Interval, name='duration')
    jeuneId = db.Column(db.String(255), db.ForeignKey('jeune.id'), name='jeune_id')
    jeune = db.relationship('SqlJeune', backref=db.backref('rdv_jeune', lazy=False))
    conseillerId = db.Column(db.Integer, db.ForeignKey('conseiller.id'), name='conseiller_id')
    conseiller = db.relationship('SqlConseiller', backref=db.backref('rdv_conseiller', lazy=False))
