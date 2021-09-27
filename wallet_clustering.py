import queue
from database import *
import sklearn.preprocessing
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from queue import Queue
import loader


clusters_queue = Queue(100)


def start_clustering(block=None):
    last_centroids = None
    if block is None:
        block = loader.get_last_block()

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
        io.block_hash == '{block}'
            AND 
        io.address == wallets.addr
    """
    wallets_df = pd.read_sql_query(query, engine)
    print(wallets_df)

    data = wallets_df.drop(['addr', 'block_hash'], axis=1).to_numpy()
    _addrs = wallets_df['addr'].to_numpy()
    
    X = sklearn.preprocessing.normalize(data)

    for n in range(100):
        print(n)

        centroids, labels, inertia, best_n = sklearn.cluster.k_means(X, 3, init=last_centroids if last_centroids is not None else 'random', 
                                                                            max_iter=1,
                                                                            n_init=1,  
                                                                            return_n_iter=True)
        


        wallets_df['cluster'] = _clusters = labels.astype(int)       
        wallets_clusters_df = wallets_df[['addr', 'cluster']]


        
        if n < 2  or np.linalg.norm(centroids-last_centroids) > 1e-6 :
            last_centroids = centroids
            clusters_queue.put((wallets_clusters_df, False))
        else:
            clusters_queue.put((wallets_clusters_df, True))
            break



    


def get_clustering():
    clusters, last = clusters_queue.get(True, 2)
    return {
        "last": last,
        "csv" : clusters.to_csv()
        }

        

start_clustering()