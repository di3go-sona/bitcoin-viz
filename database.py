from sqlalchemy import create_engine
from sqlalchemy import MetaData
from sqlalchemy import Table, Column, Integer, String, Float, TIMESTAMP
from sqlalchemy.orm import declarative_base, Session, relationship
from sqlalchemy.sql.schema import ForeignKey


engine = create_engine("sqlite+pysqlite:///bitcoinviz_db.sqlite", echo=True, future=True)
Base = declarative_base()

class Block(Base):
    __tablename__ = 'blocks'
    
    hash = Column('hash', String(64), primary_key=True)
    time = Column('time', TIMESTAMP)
    n_tx = Column('n_tx', Integer)
    size = Column('size', Integer)
    height = Column('height', Integer)

    #TO-DO: avg/tot amount transactions, sort on time

    # Foreign Key
    transactions = relationship('Transaction', back_populates='transactions')

    def __repr__(self):
       return f"Block(height={self.height!r}, time={self.time!r}, size={self.size!r})"

class Transaction(Base):
    __tablename__ = 'transactions'
    
    tx_id = Column('tx_id', String(64), primary_key=True)
    out_wallet_id = Column('out_wallet_id', String(20))
    # tot_value = Column('tot_value', Float) as dynamic query

    # Foreign Key
    block_hash = Column('block_hash', String(64), ForeignKey('blocks.hash'))
    block = relationship('Block', back_populates='blocks')

    # Foreign Key
    vouts = relationship('TransactionVout')

    def __repr__(self):
       return f"User(id={self.tx_id!r}, value={self.value!r}, out_wallet_id={self.out_wallet_id!r})"

class TransactionVout(Base):
    __tablename__ = 'transaction_vouts'

    id = Column('id', Integer, primary_key=True)
    value = Column('value', Float)
    address = Column('address', String(64))

    # Foreign Key
    transaction_id = Column('transaction_id', String(64), ForeignKey('transactions.tx_id'), primary_key=True)


Base.metadata.create_all(engine)
