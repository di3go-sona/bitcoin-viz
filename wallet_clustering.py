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
    _addrs = pandas_df['addr'].to_numpy()
    
    X = sklearn.preprocessing.normalize(data)

    for n in range(100):
        print(n)

        centroids, labels, inertia, best_n = sklearn.cluster.k_means(X, 3, init=last_centroids if last_centroids is not None else 'random', 
                                                                            max_iter=1,
                                                                            n_init=1,  
                                                                            return_n_iter=True)
        



     
        _clusters = labels.astype(int)
       
        clusters_data_df = pd.DataFrame( np.stack((_addrs, _clusters)).T, columns=['addr', 'cluster'])


        
        if n < 2  or np.linalg.norm(centroids-last_centroids) > 1e-6 :
            last_centroids = centroids
            clusters_queue.put((clusters_data_df, False))
        else:
            clusters_queue.put((clusters_data_df, True))
            break



    


def get_clustering():
    clusters, last = clusters_queue.get(True, 2)
    return {
        "last": last,
        "csv" : clusters.to_csv()
        }

        

# start_clustering()