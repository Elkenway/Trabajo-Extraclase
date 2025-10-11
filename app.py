from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="DOO",
        user="postgres",
        password="14592407",
        port="5432"
    )

@app.route('/api/productos')
def get_productos():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, nombre, precio, stock FROM productos;")
    productos = [
        {"id": row[0], "nombre": row[1], "precio": row[2], "stock": row[3]}
        for row in cur.fetchall()
    ]
    cur.close()
    conn.close()
    return jsonify(productos)

if __name__ == '__main__':
    app.run(port=3000, debug=True)

