from database import Transaction, engine, Session
from sqlalchemy import select, distinct


def get_wallets_ids():
    query = """SELECT DISTINCT(out_wallet_id) FROM 'transaction' """
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()

def get_transactions_ids():
    query = """SELECT DISTINCT(tx_id) FROM 'transaction' """
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()

def get_weighted_transactions_ids():
    query = """SELECT tx_id, sum(value) FROM 'transaction' GROUP BY tx_id """
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()

def get_transactions():
    query = """SELECT out_wallet_id, tx_id FROM 'transaction' """
    with Session(engine) as db:

        cur = db.execute(query)
        return cur.fetchall()


def get_nodes():
    nwallets = [ {"id": id, "type": "wallet"} for id, in get_wallets_ids() ]
    ntransactions = [ {"id": id, "type": "transaction"} for id, in get_transactions_ids() ]
    return nwallets + ntransactions

def get_weigthed_nodes():
    nwallets = [ {"id": id, "type": "wallet", "w":0 } for id, in get_wallets_ids() ]
    ntransactions = [ {"id": id, "type": "transaction","w":w} for id,w in get_weighted_transactions_ids() ]
    return nwallets + ntransactions

def get_links():
    ltransactions = [ {"source": w, "target": t} for w,t in get_transactions() ]
    return ltransactions

def get_graph():
    return {'nodes':  get_nodes(), 'links':  get_links() }

def get_weigthed_graph():
    return {'nodes':  get_weigthed_nodes(), 'links':  get_links() }


### Timeline endpoints

def get_blocks():   
    query = """SELECT hash, time, n_tx, height FROM blocks ORDER BY time ASC"""
    with Session(engine) as db:
        cur = db.execute(query)
        blocks = cur.fetchall()
        res = ["hash,time,n_tx,height"] + ["{},{},{},{}".format(*b) for b in blocks]
        return "\n".join(res)
    