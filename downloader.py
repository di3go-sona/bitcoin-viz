#! python3
import subprocess, json, sys
from tqdm import tqdm
from loguru import logger
from datetime import datetime


from database import Block, Transaction, TransactionVout,  engine, Session


logger.remove()
logger.add(sys.stderr, level="DEBUG")


def download_block(block_height):
    
    block_hash = subprocess.check_output(['bitcoin-cli',  'getblockhash', f"{block_height}" ]).decode('utf8').strip()
    raw_block = subprocess.check_output(['bitcoin-cli', 'getblock',  block_hash, "2"]).decode('utf8')
    block_dic = json.loads(raw_block)
    
    with Session(engine) as db:


        block_time = datetime.fromtimestamp(int(block_dic['time']))
        block_n_tx = block_dic['nTx']
        block_size = block_dic['size']

        block = Block(hash    = block_hash,
                    height    = block_height,
                    time      = block_time,
                    n_tx      = block_n_tx,
                    size      = block_size)

        db.add(block)            
    
        for transaction_dic in block_dic['tx']:
            transaction_id = transaction_dic['txid']

            transaction = Transaction(id=transaction_id,
                                      block_hash=block_hash)

            db.add(transaction)

            # TODO add vins(Diesel) parsing
            # vins = transaction_dic['vin'] 

            for vout in transaction_dic['vout']:
                
                addrs = vout['scriptPubKey'].get('addresses', [None] )
                
                if len(addrs) > 1:
                    # if more than one is a multisig transaction
                    logger.warning(f"Multiple addresses found for txid: {transaction_id} in blockhash: {block_hash} ")
                
                vout_address = addrs[0]
                vout_value = vout['value']
                vout_id = vout['n']
                vout = TransactionVout(transaction_id=transaction_id, address=vout_address, value=vout_value, id = vout_id)

                db.add(vout)
                    
        try:
            db.commit()
        except Exception as e :
            db.rollback()
            logger.warning(f'Transaction aborted, {e}')

def get_last_block():
    last_block = subprocess.check_output(['bitcoin-cli',  'getblockcount' ]).decode('utf8').strip()
    return int(last_block)

if __name__ == '__main__':

    num_blocks = 10
    if len(sys.argv) < 2:
        print("Usage: downloader.py [num_blocks] ")
        # exit(1)
    else:
        num_blocks = int(sys.argv[1])

    last_block = get_last_block()
    for block_height in tqdm(range(last_block, last_block-num_blocks, -1)):
        logger.debug(f"Downloading block: {block_height}")
        download_block(block_height)