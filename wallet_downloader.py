# Sample wallet return 
# {
#   "hash160": "660d4ef3a743e3e696ad990364e555c271ad504b",
#   "address": "1AJbsFZ64EpEfS5UAjAfcUG8pH8Jn3rn1F",
#   "n_tx": 17,
#   "n_unredeemed": 2,
#   "total_received": 1031350000,
#   "total_sent": 931250000,
#   "final_balance": 100100000,
#   "txs": [
#     "--Array of Transactions--"
#   ]
# }



import json
import os
import requests
from sqlalchemy.sql.expression import join
from database import Session, engine

from loguru import logger
from time import sleep


os.environ["GOOGLE_APPLICATION_CREDENTIALS"]="credentials.json"
os.makedirs('wallets', exist_ok=True)





def get_wallets():
    query = "SELECT DISTINCT(address) from transaction_vouts;"
    with Session(engine) as db:
        cur = db.execute(query)
        return [ v for v, in cur.fetchall() ]

def download_wallet(addr):
    logger.debug(f"Downloading wallet {addr}")
    try:
        resp = requests.get(f"https://chain.so/api/v2/address/BTC/{addr}")
        
        wallet_dic = json.loads(resp.content)
        print(wallet_dic)
        with open(os.path.join('wallets',f'{addr}.json'), 'w') as fout:
            json.dump(wallet_dic, fout)

        exit()
    except Exception as e:
        logger.warning(f"Error {e} while downloading wallet {addr}")






def download_wallets():
    pass


def download_wallets():
    pass


if __name__ == '__main__':
    wallets = get_wallets()
    logger.info(f"Found {len(wallets)} unique wallet addresses")
    for w in wallets:
        download_wallet(w)

        sleep(2)
