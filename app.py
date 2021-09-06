from flask import Flask, render_template
import json 
import loader


app = Flask(__name__, static_folder='static/', template_folder='templates/', )

@app.route("/")
def index():
    return render_template('index.html.j2')

@app.route("/timeline")
def timeline():
    return render_template('timeline.html.j2')
    
@app.route("/graph")
def graph():
    return json.dumps(loader.get_weigthed_graph())