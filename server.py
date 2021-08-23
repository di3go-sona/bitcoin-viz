from database import Transaction, engine, Session
from sqlalchemy import select, distinct

def get_wallets_ids():
    query = """SELECT DISTINCT(out_wallet_id) FROM 'transaction' LIMIT 10"""
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()

def get_transactions_ids():
    query = """SELECT DISTINCT(tx_id) FROM 'transaction' LIMIT 10"""
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()

def get_transactions():
    query = """SELECT out_wallet_id, tx_id FROM 'transaction' LIMIT 10"""
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()

def get_nodes():
    nwallets = [ {"id": id, "type": "wallet"} for id in get_wallets_ids() ]
    ntransactions = [ {"id": id, "type": "transaction"} for id in get_transactions_ids() ]
    return nwallets + ntransactions

def get_links():
    ltransactions = [ {"source": w, "target": t} for w,t in get_transactions() ]
    return ltransactions

def get_graph():
    return {'nodes':  get_nodes(), 'links':  get_links() }

print(get_graph())