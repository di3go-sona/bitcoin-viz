from flask import Flask, render_template

from loader import get_graph_json


app = Flask(__name__, static_folder='static/', template_folder='templates/', )

@app.route("/")
def index():
    return render_template('index.html.j2')

@app.route("/graph")
def graph():
    return get_graph_json()