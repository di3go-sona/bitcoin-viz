import pandas as pd 
import numpy as np 
import sklearn.preprocessing
from database import engine
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA

def process_blocks():
    pandas_df = pd.read_sql_table('wallets', engine)
    
    data = pandas_df.loc[:, pandas_df.columns != 'addr'].to_numpy()
    _addrs = pandas_df['addr'].to_numpy()
    
    X = sklearn.preprocessing.normalize(data)

    pca = PCA(2, )
    pca_coords = pca.fit_transform(X)

    tsne = TSNE(2, verbose=True, )
    tsne_coords = tsne.fit_transform(X)


    addrs = np.expand_dims(_addrs,1)


    pca_data = np.concatenate([addrs, pca_coords, tsne_coords ], axis=1)
    pca_data_df = pd.DataFrame(pca_data, columns=['addr', 'pca_1', 'pca_2', 'tsne_1', 'tsne_2'])

    pca_data_df.to_sql('wallets_pca', engine,  if_exists='replace', index=False )


if __name__ == '__main__':
    process_blocks()