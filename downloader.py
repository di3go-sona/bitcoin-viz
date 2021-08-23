import subprocess, json, sys
from tqdm import tqdm
from loguru import logger


from database import Transaction, engine, Session


logger.remove()
logger.add(sys.stderr, level="INFO")



BLOCK_END  = 216782
BLOCK_RANGE = 100
BLOCK_START = BLOCK_END - BLOCK_RANGE

def download_transactions(c_bstart, c_bend):
    for c in tqdm(range(c_bstart, c_bend + 1)):
        block_hash = subprocess.check_output(['bitcoin-cli',  'getblockhash', f"{c}" ]).decode('utf8').strip()
        raw_block = subprocess.check_output(['bitcoin-cli', 'getblock',  block_hash, "2"]).decode('utf8')
        block = json.loads(raw_block)
        txs = block['tx']
        with Session(engine) as db:
            for tx in txs:
                vouts = tx['vout']
                vins = tx['vin']
                for vout in vouts:
                    value = vout['value']
                    txid = tx['txid']
                    try:
                        addrs = vout['scriptPubKey']['addresses']
                        assert(len(addrs) == 1)
                        addr = addrs.pop()

                        t = Transaction(tx_id=txid,  value=value, out_wallet_id=addr)
                        logger.debug(f"{t}")
                        
                        db.add(t)
                            
                    except KeyError:
                        logger.warning(f"Address not found for txid: {txid} in blockhash: {block_hash} ")
                    except AssertionError:
                        logger.warning(f"Multiple ddresses found for txid: {txid} in blockhash: {block_hash} ")
                        
            try:
                db.commit()
            except:
                db.rollback()



if __name__ == '__main__':
    download_transactions(BLOCK_START, BLOCK_END)
    