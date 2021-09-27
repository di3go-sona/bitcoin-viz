from flask import Flask, render_template, request, redirect
import json 
import loader
from wallet_clustering import * 
app = Flask(__name__, static_folder='static/', template_folder='templates/')
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.route("/")
def index():
    return render_template('index.html.j2')

@app.route("/range_bitcoin")
def range_bitcoin():
    return loader.get_range_bitcoin()

@app.route("/timeline/csv")
def timeline_csv_base():
    plot = request.args.get("plot")
    min = request.args.get("min")
    max = request.args.get("max")
    types = request.args.get("types")
    return loader.get_blocks(plot, min, max, types)

@app.route("/wallets")
def wallets_csv_base():
    block = request.args.get("block", loader.get_last_block())
    return loader.get_wallets(block)




@app.route("/wallets/clusters/start")
def wallets_clusters_new():
    block = request.args.get("block")
    print("Clustering Started")
    start_clustering(block)
    print("Clustering Ended")
    return "Clustering Ended"

@app.route("/wallets/clusters")
def wallets_clusters_csv_base():
    block = request.args.get("block")
    return get_clustering()

@app.route("/graph")
def graph():
    block = request.args.get("block")
    min = request.args.get("min")
    max = request.args.get("max")
    types = request.args.get("types")
    return json.dumps(loader.get_weigthed_graph(block, min, max, types))