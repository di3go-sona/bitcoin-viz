from json import load
import queue
from database import *
import sklearn.preprocessing
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from queue import Queue
import loader

available = False
last_centroids = None
centroids_queue = Queue(100)

query = f"""
    SELECT block_hash, wallets.*
    FROM 
        (SELECT DISTINCT transactions.block_hash, inputs.address
        FROM inputs, transactions
        WHERE 
        inputs.transaction_id == transactions.id
        UNION 
        SELECT DISTINCT transactions.block_hash, outputs.address
        FROM outputs, transactions
        WHERE 
        outputs.transaction_id == transactions.id
        ) AS io, wallets
    WHERE 
    io.address == wallets.addr
    ORDER BY block_hash, wallets.addr
"""

wallets_df = pd.read_sql_query(query, engine)
wallets_data = wallets_df.drop(['addr', 'block_hash'], axis=1).to_numpy()
X = sklearn.preprocessing.normalize(wallets_data)

def start_clustering():
    global last_centroids, available
    last_centroids, available = (None, False)
    for n in range(100):
        print(n)

        centroids, labels, inertia = sklearn.cluster.k_means(X, 3, init=last_centroids if last_centroids is not None else 'random', 
                                                                            max_iter=1,
                                                                            n_init=3)
                                                                            
        

        if n < 2  or np.linalg.norm(centroids-last_centroids) > 1e-6 :
            last_centroids = centroids
            centroids_queue.put((centroids, False))
        else:
            centroids_queue.put((centroids, True))
            available = True
            break



    


def get_clustering(block):
    global last_centroids, available
    if centroids_queue.empty() and  available:
        centroids, last = (last_centroids, True)
    else:
        centroids, last = centroids_queue.get(True, 2)
    block_selector = wallets_df.block_hash == block

    block_wallets_df = wallets_df[ block_selector ]

    X = sklearn.preprocessing.normalize(wallets_data)
    _, labels, _ = sklearn.cluster.k_means(X[block_selector], 3, init=centroids, max_iter=1)

    block_wallets_df.loc[:, 'cluster'] = labels.astype(int)   
    return block_wallets_df[['addr', 'cluster']], last
    return {
        "last": last,
        "csv" : block_wallets_df[['addr', 'cluster']].to_csv()
        }

        

# start_clustering()
# print(get_clustering())