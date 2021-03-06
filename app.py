from flask import Flask, render_template, request, redirect, g
import json 
import loader


app = Flask(__name__, static_folder='static/', template_folder='templates/')
app.config['TEMPLATES_AUTO_RELOAD'] = True

@app.before_request
def before_request_func():
    g.n_clusters = None if loader.wallet_clustering.last_centroids is None else loader.wallet_clustering.last_centroids.shape[0]

@app.route("/")
def index():
    return render_template('index.html.j2', n_clusters=g.n_clusters)

@app.route("/graph_header")
def graph_header():
    return render_template('graph_header.html.j2', n_clusters=g.n_clusters)

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

@app.route("/wallet")
def wallet_get():
    wallet_id = request.args.get("wallet_id")
    return json.dumps(loader.get_wallet(wallet_id))

@app.route("/wallets")
def wallets_get():
    block = request.args.get("block", loader.get_last_block())
    return loader.get_wallets(block)

@app.route("/wallets/clusters/start")
def wallets_clusters_start():
    n_clusters = int(request.args.get("n_clusters"))
    loader.wallet_clustering.start_clustering(n_clusters)
    return "Clustering Ended"

@app.route("/wallets/clusters/reset")
def wallets_clusters_reset():

    loader.wallet_clustering.reset_clustering()
    return "Clustering Reset"

@app.route("/wallets/clusters")
def wallets_clusters_get():
    block = request.args.get("block")
    return loader.get_wallets_clusters(block)

@app.route("/graph")
def graph():
    block = request.args.get("block")
    # min = request.args.get("min")
    # max = request.args.get("max")
    # types = request.args.get("types")
    # return json.dumps(loader.get_weigthed_graph(block, min, max, types))
    return json.dumps(loader.get_weigthed_graph(block))
