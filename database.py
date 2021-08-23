from sqlalchemy import create_engine
from sqlalchemy import MetaData
from sqlalchemy import Table, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, Session


engine = create_engine("sqlite+pysqlite:///transaction_db.sqlite", echo=True, future=True)
Base = declarative_base()

class Transaction(Base):
    __tablename__ = 'transaction'
    
    tx_id = Column('tx_id', String(64), primary_key=True)
    out_wallet_id = Column('out_wallet_id', String(20), primary_key=True)
    value = Column('value', Float)

    def __repr__(self):
       return f"User(id={self.tx_id!r}, value={self.value!r}, out_wallet_id={self.out_wallet_id!r})"

Base.metadata.create_all(engine)