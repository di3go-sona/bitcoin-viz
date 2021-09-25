import json
from re import match
from database import Block, engine, Session
from sqlalchemy import text, func

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

def get_transactions_ids(block, min, max, types_clause):
    query = f"""
                SELECT DISTINCT(transactions_ext.id) as id 
                FROM transactions_ext
                WHERE transactions_ext.block_hash = '{block}' AND transactions_ext.tot_value >= {min} AND transactions_ext.tot_value <= {max} {types_clause}
                LIMIT 500
            """
    with Session(engine) as db:
        cur = db.execute(query)
        return cur.fetchall()


def get_weigthed_graph(block, min, max, types):

    range = json.loads(get_range_bitcoin())
    local_min = min if min is not None else range['min']
    local_max = max if max is not None else range['max']

    local_types = "('%s')" % "', '".join(types.split(","))
    types_clause = f"AND transactions_ext.type in {local_types}"

    local_block = block if block is not None else '00000000000000000006467d4ceb7b301b679b4146d7269a270091e5c82938aa'

    transactions_ids = [tx_id[0] for tx_id in get_transactions_ids(local_block, local_min, local_max, types_clause)]

    inputs_links = get_inputs_links(transactions_ids)
    inputs_address = set([link[0] for link in inputs_links])

    outputs_links = get_outputs_links(transactions_ids)
    outputs_address = set([link[0] for link in outputs_links]).difference(inputs_address)

    tx_json = [{"id": tx_id, "type": "tx"}     for tx_id in transactions_ids]

    inputs_links_json  = [{"source": link[0], "target": link[1]}  for link in inputs_links]
    outputs_links_json = [{"source": link[1], "target": link[0]} for link in outputs_links]

    in_json    = [{"id": in_addr, "type": "wa"}    for in_addr in inputs_address]
    out_json   = [{"id": out_addr, "type": "wa"}   for out_addr in outputs_address]

    return {'nodes':  tx_json + in_json + out_json, 'links':  inputs_links_json + outputs_links_json}

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