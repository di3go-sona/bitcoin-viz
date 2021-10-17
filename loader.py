import json
from database import Block, engine, Session
import wallet_clustering 
import pandas as pd 
from flask import g
### Graph endpoints

def get_inputs_links(transactions_ids):
    query = f"""
                SELECT inputs.address, inputs.transaction_id
                FROM inputs
                WHERE inputs.transaction_id IN {"('%s')" % "', '".join(transactions_ids)}
             """
    with Session(engine) as db:
        cur = db.execute(query)
        return cur.fetchall()

def get_outputs_links(transactions_ids):
    query = f"""
                SELECT outputs.address, outputs.transaction_id
                FROM outputs
                WHERE outputs.transaction_id IN {"('%s')" % "', '".join(transactions_ids)}
             """
    with Session(engine) as db:
        cur = db.execute(query)
        return cur.fetchall()

def get_transactions_ids(block):
    query = f"""
                SELECT transactions_ext.id as id, (n_inputs+n_outputs) as n_links, tot_value, type
                FROM transactions_ext
                WHERE transactions_ext.block_hash = '{block}'
            """
    with Session(engine) as db:
        cur = db.execute(query)
        return cur.fetchall()


def get_weigthed_graph(block):

    local_block = block or get_last_block()
    transactions_ids_tuples = get_transactions_ids(local_block)
    transactions_ids = [tx[0] for tx in transactions_ids_tuples]

    inputs_links = get_inputs_links(transactions_ids)
    inputs_address = set([link[0] for link in inputs_links])

    outputs_links = get_outputs_links(transactions_ids)
    outputs_address = set([link[0] for link in outputs_links]).difference(inputs_address)

    tx_json = [{"id": tx[0], "type": "tx", "n_links": tx[1], "tot_value": tx[2], "tx_type": tx[3]} for tx in transactions_ids_tuples]

    inputs_links_json  = [{"source": link[0], "target": link[1], "type":"in"}  for link in inputs_links]
    outputs_links_json = [{"source": link[1], "target": link[0], "type":"out"}  for link in outputs_links]

    in_json    = [{"id": in_addr, "type": "wa"}    for in_addr in inputs_address]
    out_json   = [{"id": out_addr, "type": "wa"}   for out_addr in outputs_address]

    return {'block_id': local_block, 'nodes':  tx_json + in_json + out_json, 'links':  inputs_links_json + outputs_links_json}

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

def get_blocks(plot, min, max, types):   

    range = json.loads(get_range_bitcoin())
    local_min = min if min is not None else range['min']
    local_max = max if max is not None else range['max']

    local_types = "('%s')" % "', '".join(types.split(","))
    types_clause = f"AND transactions_ext.type in {local_types}"
        
    with Session(engine) as db:

        if plot == "transactions":
            query = f"""
                        SELECT blocks.hash, blocks.height, blocks.time, (CASE WHEN id IS NULL THEN 0 ELSE count(*) END) as n_tx
                        FROM blocks LEFT JOIN 
                        (
                            SELECT * FROM transactions_ext 
                            WHERE transactions_ext.tot_value >= {local_min} AND transactions_ext.tot_value <= {local_max} {types_clause}
                        ) as tx_filtered
		                ON blocks.hash=tx_filtered.block_hash
                        GROUP BY blocks.hash
                        ORDER BY height ASC
                    """
            
        elif plot == "bitcoins":
            query = f"""
                        SELECT blocks.hash, blocks.height, blocks.time, (CASE WHEN id IS NULL THEN 0 ELSE sum(tx_filtered.tot_value) END) as tot_bitcoin 
                        FROM blocks LEFT JOIN 
                        (
                            SELECT * FROM transactions_ext 
                            WHERE transactions_ext.tot_value >= {local_min} AND transactions_ext.tot_value <= {local_max} {types_clause}
                        ) as tx_filtered
		                ON blocks.hash=tx_filtered.block_hash
                        GROUP BY blocks.hash
                        ORDER BY height ASC
                    """

        else:
            query = """SELECT hash, height, time, size FROM blocks ORDER BY time ASC"""

        cur = db.execute(query)
        blocks = cur.fetchall()
        res = ["hash,height,time,bar_value"] + ["{},{},{},{}".format(*b) for b in blocks]
        return "\n".join(res)


### Wallets endpoints

def get_wallet(wallet_id):
    query = f"""
                SELECT * FROM wallets WHERE wallets.addr = '{wallet_id}'
             """

    with Session(engine) as db:
        cur = db.execute(query)
        res = cur.fetchone()
        return dict(res)


def get_wallets(block_hash):
    query = f"""
    SELECT block_hash, addr, pca_1 as x ,pca_2 as y
    FROM 
        (SELECT DISTINCT transactions.block_hash, inputs.address
        FROM inputs, transactions
        WHERE 
        inputs.transaction_id = transactions.id
        UNION 
        SELECT DISTINCT transactions.block_hash, outputs.address
        FROM outputs, transactions
        WHERE 
        outputs.transaction_id = transactions.id
        ) AS io, wallets_pca
    WHERE 
        io.block_hash = '{block_hash}'
            AND 
        io.address = wallets_pca.addr
    ORDER BY block_hash, wallets_pca.addr
    """

    wallets_df = pd.read_sql_query(query, engine)
    if wallet_clustering.available:
        block_wallets_df, _ = wallet_clustering.get_clustering(block_hash)
       
        wallets_df.loc[:, 'cluster'] = block_wallets_df['cluster'].to_numpy()

    res = {
        "min_x" : wallets_df['x'].min(),
        "max_x" : wallets_df['x'].max(),
        "min_y" : wallets_df['y'].min(),
        "max_y" : wallets_df['y'].max(),
        "n_clusters" : g.n_clusters,
        "csv" : wallets_df.to_csv()
    }

    return json.dumps(res)


def get_wallets_clusters(block=None):
    if block is None or block == 'null':
        block = get_last_block()
    block_wallets_df, last = wallet_clustering.get_clustering(block)
    return {
        "last": last,
        "csv" : block_wallets_df.to_csv()
        }

def get_last_block():
    query = """
            SELECT  hash
            FROM blocks
            ORDER BY time desc
            LIMIT 1
            """

    with Session(engine) as db:
        cur = db.execute(query)
        last_block, = cur.fetchone()
        return last_block