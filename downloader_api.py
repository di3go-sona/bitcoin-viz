#! python3
import subprocess, json, sys
from tqdm import tqdm
from loguru import logger
from datetime import datetime
from sqlalchemy.sql import text
from database import *
import requests
from time import sleep 

logger.remove()
logger.add(sys.stderr, level="DEBUG")

def chunk_list(datas, chunksize):
    """Split list into the chucks

    Params:
        datas     (list): data that want to split into the chunk
        chunksize (int) : how much maximum data in each chunks

    Returns:
        chunks (obj): the chunk of list
    """

    for i in range(0, len(datas), chunksize):
        yield datas[i:i + chunksize]


@logger.catch
def download_transaction(transaction_id, block_hash, db):

    if db.query(Transaction).get(transaction_id) is not None:
        logger.warning(f"Transaction {transaction_id} already exists, skipping it")
        return

    logger.debug(f"Downloading transaction: {transaction_id} in blockhash: {block_hash}")
    res = requests.get(f"https://chain.so/api/v2/get_tx/BTC/{transaction_id}").json()

    transaction_dic = res['data']
    block_network_fee = transaction_dic['network_fee']

    transaction = Transaction(id=transaction_id,
                                block_hash=block_hash,
                                network_fee=block_network_fee)

    db.add(transaction)

    for output in transaction_dic['outputs']:
        
        output_address = output['address']
        output_value = float(output['value'])
        output_id = output['output_no']
        output_type = output['type']
        
        if output_address == "nonstandard":
            logger.warning(f"Address with invalid format found for output in txid: {transaction_id} in blockhash: {block_hash} ")
            output_address = None
            if output_value == 0:
                continue

        output = Output(transaction_id=transaction_id, address=output_address, value=output_value, id=output_id, type=output_type)
        db.add(output)

    for input in transaction_dic['inputs']:
        
        input_address = input['address']
        input_value = float(input['value'])
        input_id = input['input_no']
        input_type = input['type']
        
        if input_address == "nonstandard":
            logger.warning(f"Address with invalid format found for input in txid: {transaction_id} in blockhash: {block_hash} ")
            input_address = None
            if input_value  == 0:
                continue

        input = Input(transaction_id=transaction_id, address=input_address, value=input_value, id=input_id, type=input_type)
        db.add(input)
    
    try:
        db.commit()
    except Exception as e :
        db.rollback()
        logger.warning(f'Transaction aborted, {e}')
                    

@logger.catch
def download_block(block_height):
    
    res = requests.get(f"https://chain.so/api/v2/get_block/BTC/{block_height}").json()
    
    block_dic = res['data']
    block_hash = block_dic['blockhash']
    block_time = datetime.fromtimestamp(int(block_dic['time']))
    block_n_tx = len(block_dic['txs'])
    block_size = block_dic['size']

    with Session(engine) as db:

        if db.query(Block).get(block_hash) is not None:
            logger.warning(f"Block {block_hash} already exists, checking its transactions")

        else:
            block = Block(hash    = block_hash,
                        height    = block_height,
                        time      = block_time,
                        n_tx      = block_n_tx,
                        size      = block_size)

            db.add(block)
            try:
                db.commit()
            except Exception as e :
                db.rollback()
                logger.warning(f'Transaction aborted, {e}')
            
    
        # for chunk in chunk_list(block_dic['txs'],64):
        #     for transaction_id in chunk:
        #         threading.Thread(target=download_transaction, args=(transaction_id, block_hash, db)).start()
        #     sleep(65)

        for transaction_id in block_dic['txs']:
            download_transaction(transaction_id, block_hash, db)
            # sleep(0.2)


def get_last_block():
    resp = requests.get("https://chain.so/api/v2/get_info/BTC")
    return resp.json()['data']['blocks']


if __name__ == '__main__':

    num_blocks = 10
    if len(sys.argv) < 2:
        print("Usage: downloader.py [num_blocks] ")
    else:
        num_blocks = int(sys.argv[1])

    # last_block = get_last_block()
    last_block = 701125
    
    for block_height in tqdm(range(last_block, last_block-num_blocks, -1)):
        logger.debug(f"Downloading block: {block_height}")
        download_block(block_height)