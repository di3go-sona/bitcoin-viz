from flask import Flask, render_template, request
import json 
import loader


app = Flask(__name__, static_folder='static/', template_folder='templates/')

# @app.route("/")
# def index():
#     return render_template('index.html.j2')

min_pca_1, max_pca_1, min_pca_2, max_pca_2 = loader.get_wallets_domain()

ctx={
    'min_pca_1': min_pca_1,
    'max_pca_1': max_pca_1,
    'min_pca_2': min_pca_2,
    'max_pca_2': max_pca_2
}

@app.route("/")
@app.route("/timeline")
def timeline():
    return render_template('timeline.html.j2',ctx=ctx)

@app.route("/timeline/csv")
def timeline_csv_base():
    param = request.args.get("param")
    return loader.get_blocks(param)

@app.route("/clusters/csv")
def clusters_csv_base():
    param = request.args.get("param")
    return loader.get_wallets(param)

# @app.route("/blocks_info")
# def get_blocks_info(): 
#     param = request.args.get("hashes")
#     hashes = param.split(":")
#     return loader.get_blocks_info(hashes)

@app.route("/graph")
def graph():
    return json.dumps(loader.get_weigthed_graph())