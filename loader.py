import json
from re import match
from database import Block, engine, Session
from sqlalchemy import text, func


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

### Filters endpoints

def get_range_bitcoin():
    query = """ SELECT min(tot_value), max(tot_value)
                FROM transactions_ext
            """
    with Session(engine) as db:
        cur = db.execute(query)
        range = cur.fetchone()
        res = json.dumps({'min': range[0], 'max': range[1]})
        return res

### Timeline endpoints

def get_blocks(param):   

    if (param == "transactions"):
        query = """SELECT hash, height, time, n_tx FROM blocks ORDER BY time ASC"""
        
    elif (param == "size"):
        query = """SELECT hash, height, time, size FROM blocks ORDER BY time ASC"""

    elif (param == "bitcoins"):
        query = """ SELECT blocks.hash, blocks.height, blocks.time, sum(outputs.value)
                    FROM blocks, transactions, outputs
                    WHERE outputs.transaction_id = transactions.id AND transactions.block_hash=blocks.hash
                    GROUP BY blocks.hash
                    ORDER BY blocks.time ASC
                """
    else:
        return ""

    with Session(engine) as db:
        cur = db.execute(query)
        blocks = cur.fetchall()
        res = ["hash,height,time,bar_value"] + ["{},{},{},{}".format(*b) for b in blocks]
        return "\n".join(res)


### Wallets endpoints

def get_wallets(blocks_list):

    query = """
            SELECT addr, pca_1, pca_2, -1 FROM wallets_pca
            LIMIT 10000
            """

    with Session(engine) as db:
        cur = db.execute(query)
        blocks = cur.fetchall()
        res = ["addr,pca_1,pca_2,cluster"] + ["{},{},{},{}".format(*b) for b in blocks]
        return "\n".join(res)

def get_wallets_domain(blocks_list=[]):

    query = """
            SELECT min(pca_1), max(pca_2), min(pca_2), max(pca_2)
            FROM wallets_pca
            """

    with Session(engine) as db:
        cur = db.execute(query)
        min_pca_1, max_pca_1, min_pca_2, max_pca_2 = cur.fetchone()
        return min_pca_1, max_pca_1, min_pca_2, max_pca_2 




# get_wallets(701125)