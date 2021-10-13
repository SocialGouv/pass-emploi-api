from initialize_db import db
from model.action_status import ActionStatus


class SqlAction(db.Model):
    __tablename__ = 'action'
    id = db.Column(db.BigInteger(), primary_key=True)
    content = db.Column(db.String(1024), name='content')
    comment = db.Column(db.String(2048), name='comment')
    isDone = db.Column(db.BOOLEAN, name='is_done')
    isVisibleByConseiller = db.Column(db.BOOLEAN, name='is_visible_by_conseiller')
    creationDate = db.Column(db.TIMESTAMP, name='creation_date')
    limitDate = db.Column(db.TIMESTAMP, name='limit_date')
    lastUpdate = db.Column(db.TIMESTAMP, name='last_update')
    status = db.Column(db.Enum(ActionStatus), name='status')
    jeune = db.relationship('SqlJeune', backref=db.backref('action_jeune', lazy=False))
    jeuneId = db.Column(db.String(255), db.ForeignKey('jeune.id'), name='jeune_id')
