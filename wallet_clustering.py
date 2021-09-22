import queue
from database import *
import sklearn.preprocessing
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from queue import Queue



clusters_queue = Queue(100)

def start_clustering():
    last_centroids = None
    pandas_df = pd.read_sql_table('wallets_meta', engine)
    data = pandas_df.loc[:, pandas_df.columns != 'addr'].to_numpy()
    X = sklearn.preprocessing.normalize(data)

    for n in range(100):
        centroids, labels, inertia, best_n = sklearn.cluster.k_means(X, 3, init=last_centroids if last_centroids is not None else 'random', 
                                                                            max_iter=1,
                                                                            n_init=1,  
                                                                            return_n_iter=True)
        



     
        _clusters = labels.astype(int)
        _addrs = pandas_df['addr'].to_numpy()
    
        addrs = np.expand_dims(_addrs,1)
        clusters = np.expand_dims(_clusters,1)

        clusters_data = np.concatenate([addrs,clusters ], axis=1)
        clusters_data_df = pd.DataFrame(clusters_data, columns=['addr', 'cluster'])


        clusters_queue.put(clusters_data_df)
        if n < 2  or np.linalg.norm(centroids-last_centroids) > 1e-6 :
            last_centroids = centroids
            print(n)
            continue
        # clusters_data_df.to_sql('wallets_clustering', engine,  if_exists='replace', index=False )


    


def get_clustering():
    try:
        return clusters_queue.get(True, 2).to_csv()
    except:
        return  pd.read_sql_table('wallets_clustering', engine).to_csv()
        


# start_clustering()