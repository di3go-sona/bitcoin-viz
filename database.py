from sqlalchemy import create_engine
from sqlalchemy import MetaData
from sqlalchemy import Table, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, Session


engine = create_engine("sqlite+pysqlite:///transaction_db.sqlite", echo=True, future=True)
Base = declarative_base()

class Transaction(Base):
    __tablename__ = 'transaction'
    
    txid = Column('txid', String(64), primary_key=True)
    
    out_address = Column('out_address', String(20), primary_key=True)
    value = Column('value', Float)



    def __repr__(self):
       return f"User(id={self.txid!r}, value={self.value!r}, out_address={self.out_address!r})"

Base.metadata.create_all(engine)