from flask import Flask, render_template, request, redirect
import json 
import loader
from context_loader import ctx
from wallet_clustering import * 
app = Flask(__name__, static_folder='static/', template_folder='templates/')


@app.route("/")
def index():
    return render_template('index.html.j2',ctx=ctx)

@app.route("/timeline/csv")
def timeline_csv_base():
    param = request.args.get("param")
    return loader.get_blocks(param)

@app.route("/wallets/csv")
def wallets_csv_base():
    blocks_list = request.args.get("blocks_list")
    return loader.get_wallets(blocks_list)



@app.route("/wallets/clusters/start")
def wallets_clusters_new():
    blocks_list = request.args.get("blocks_list")
    start_clustering()
    return redirect('/wallets/clusters/csv')

@app.route("/wallets/clusters/csv")
def wallets_clusters_csv_base():
    blocks_list = request.args.get("blocks_list")
    return get_clustering()


# @app.route("/blocks_info")
# def get_blocks_info(): 
#     param = request.args.get("hashes")
#     hashes = param.split(":")
#     return loader.get_blocks_info(hashes)

@app.route("/graph")
def graph():
    return json.dumps(loader.get_weigthed_graph())