import psycopg2
from datetime import datetime
import numpy as np
# Replace with your actual pgAdmin credentials
DB_CONFIG = {
    "dbname": "construction_ppe_violation",
    "user": "postgres",
    "password": "Codeis@04",
    "host": "localhost",
    "port": "5432"
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def log_violation(worker_uuid, equipped, violated, evidence_path):
    """Inserts a new violation record into the PostgreSQL table."""
    conn = get_connection()
    cur = conn.cursor()
    
    query = """
    INSERT INTO violations (worker_id, equipped_items, violated_items, evidence_path)
    VALUES (%s, %s, %s, %s)
    """
    
    alert = f"Alert: Missing {violated}"
    
    try:
        cur.execute(query, (worker_uuid, equipped, violated, evidence_path))
        conn.commit()
        print(f"Successfully logged violation for {worker_uuid}")
    except Exception as e:
        print(f"Database Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def register_new_worker(embedding, display_name):
    conn = get_connection()
    cur = conn.cursor()
    # Convert numpy array to list if needed
    if isinstance(embedding, list):
        emb_list = embedding
    else:
        emb_list = embedding.tolist() 
    
    cur.execute(
        "INSERT INTO workers (face_embedding, display_name) VALUES (%s, %s) RETURNING id",
        (emb_list, display_name)
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return str(new_id)

def update_worker_id_in_violations(old_id, new_id):
    """Updates the worker_id in violations table from a temporary/unknown ID to a real UUID."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE violations SET worker_id = %s WHERE worker_id = %s",
            (new_id, old_id)
        )
        conn.commit()
        if cur.rowcount > 0:
            print(f"[DB] Updated {cur.rowcount} violation records from {old_id} to {new_id}")
    except Exception as e:
        print(f"[DB ERROR] Failed to update violation IDs: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

# In your database.py script
def find_matching_worker(new_embedding, threshold=0.4):
    conn = get_connection()
    cur = conn.cursor()
    
    # 1. Fetch all known embeddings
    cur.execute("SELECT id, face_embedding FROM workers")
    rows = cur.fetchall()
    
    best_match = None
    min_dist = threshold  # Any distance higher than 0.4 is considered a different person

    for worker_id, db_embedding in rows:
        # Convert DB list back to numpy array for math
        db_emb = np.array(db_embedding)
        
        # 2. Calculate Distance (Euclidean)
        dist = np.linalg.norm(new_embedding - db_emb)
        
        if dist < min_dist:
            min_dist = dist
            best_match = worker_id
            
    cur.close()
    conn.close()
    return best_match