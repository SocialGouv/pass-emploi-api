from initialize_db import db


class SqlAction(db.Model):
    __tablename__ = 'action'
    id = db.Column(db.BigInteger(), primary_key=True)
    content = db.Column(db.String(1024), name='content')
    comment = db.Column(db.String(2048), name='comment')
    isDone = db.Column(db.BOOLEAN, name='is_done')
    creationDate = db.Column(db.DATETIME, name='creation_date')
    lastUpdate = db.Column(db.DATETIME, name='last_update')
    jeuneId = db.Column(db.String(255), db.ForeignKey('jeune.id'), name='jeune_id')
    jeune = db.relationship('SqlJeune', backref=db.backref('action_jeune', lazy=False))
