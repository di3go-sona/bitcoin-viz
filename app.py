from flask import Flask, render_template, request
import json 
import loader


app = Flask(__name__, static_folder='static/', template_folder='templates/')

@app.route("/")
def index():
    return render_template('index.html.j2')

@app.route("/timeline")
def timeline():
    return render_template('timeline.html.j2')

@app.route("/timeline/csv")
def timeline_csv_base():
    param = request.args.get("param")
    return loader.get_blocks(param)
    
@app.route("/graph")
def graph():
    return json.dumps(loader.get_weigthed_graph())