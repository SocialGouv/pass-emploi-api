from initialize_db import db


class SqlConseiller(db.Model):
    __tablename__ = 'conseiller'
    id = db.Column(db.BigInteger, primary_key=True)
    firstName = db.Column(db.String(80), name='first_name', nullable=False)
    lastName = db.Column(db.String(120), name='last_name', nullable=False)
