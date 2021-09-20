


import json
import os
import requests
from sqlalchemy.sql.expression import join
from database import *

from loguru import logger
from time import sleep

import threading

os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="credentials.json"
os.makedirs('wallets', exist_ok=True)





def get_wallets():
    query = "SELECT DISTINCT(address) from outputs;"
    with Session(engine) as db:
        cur = db.execute(query)
        return [ v for v, in cur.fetchall() ]

def get_wallets():
    query = "SELECT DISTINCT(address) from outputs;"
    with Session(engine) as db:
        cur = db.execute(query)
        total_wallets = { v for v, in cur.fetchall() }
        local_wallets = { w.split('.')[0] for w in os.listdir('wallets/') }
        return list(total_wallets - local_wallets)

# Sample wallet return 
# {
#   "status": "success",
#   "data": {
#     "network": "BTC",
#     "address": "12dRugNcdxK39288NjcDV4GX7rMsKCGn6B",
#     "balance": "260.43739238",
#     "received_value": "103307.75015062",
#     "pending_value": "0.00000000",
#     "total_txs": 12554,
#     "txs": [
#       {
#         "txid": "655c6c6a08371d0ac5e47c0516996c9d593b88e71e21259bd3bd7f432b22fd8d",
#         "block_no": 701305,
#         "confirmations": 2,
#         "time": 1632076658,
#         "incoming": {
#           "output_no": 0,
#           "value": "6.28574088",
#           "spent": null,
#           "inputs": [
#             {
#               "input_no": 0,
#               "address": "coinbase",
#               "received_from": null
#             }
#           ],
#           "req_sigs": null,
#           "script_asm": "OP_DUP OP_HASH160 11dbe48cc6b617f9c6adaf4d9ed5f625b1c7cb59 OP_EQUALVERIFY OP_CHECKSIG",
#           "script_hex": "76a91411dbe48cc6b617f9c6adaf4d9ed5f625b1c7cb5988ac"
#         }
#       },
#       {


def download_wallet(addr):
    logger.debug(f"Downloading wallet {addr}")

    resp = requests.get(f"https://chain.so/api/v2/address/BTC/{addr}")
    
    wallet_dic = json.loads(resp.content)['data']
    # print(wallet_dic)
    with open(os.path.join('wallets',f'{addr}.json'), 'w') as fout:
        json.dump(wallet_dic, fout)

        w = Wallet()
        w.id = addr
        w.n_tx = wallet_dic['total_txs']
        w.tot_received = wallet_dic['received_value']
        w.balance = wallet_dic['balance']
        w.pending = wallet_dic['pending_value']
        
        
        with Session(engine) as db:
            db.add(w)
            try:
                db.commit()
            except Exception as e :
                db.rollback()
                logger.warning(f'Transaction aborted, {e}')






def download_wallets():
    pass


def download_wallets():
    pass


if __name__ == '__main__':
    wallets = get_wallets()
    logger.info(f"Found {len(wallets)} unique wallet addresses")
    for w in wallets:
        # download_wallet(w)
        threading.Thread(target=download_wallet, args=(w, )).start()
        sleep(0.3)
