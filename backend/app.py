from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import threading
import queue
import time
from io import BytesIO

from model.style_transfer import StyleTransferModel
from model.style_loader import get_style_list, get_style_image, generate_sample_style_images

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
RESULT_DIR = os.path.join(BASE_DIR, 'results')
STYLES_DIR = os.path.join(BASE_DIR, 'styles')

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)
os.makedirs(STYLES_DIR, exist_ok=True)

task_queue = queue.Queue()
task_status = {}
task_lock = threading.Lock()

model_instance = None
model_lock = threading.Lock()

def get_model():
    global model_instance
    with model_lock:
        if model_instance is None:
            print("Loading style transfer model...")
            model_instance = StyleTransferModel()
            print("Model loaded successfully!")
        return model_instance

def worker():
    while True:
        task_id, content_data, style_key, num_steps = task_queue.get()
        try:
            with task_lock:
                task_status[task_id] = {
                    'status': 'processing',
                    'progress': 0,
                    'result': None
                }
            
            def progress_callback(progress):
                with task_lock:
                    if task_id in task_status:
                        task_status[task_id]['progress'] = progress
            
            model = get_model()
            style_data = get_style_image(style_key)
            
            if style_data is None:
                with task_lock:
                    task_status[task_id] = {
                        'status': 'error',
                        'progress': 0,
                        'error': 'Style not found'
                    }
                continue
            
            result_image = model.transfer_style(
                content_data,
                style_data,
                num_steps=num_steps,
                progress_callback=progress_callback
            )
            
            result_path = os.path.join(RESULT_DIR, f"{task_id}.jpg")
            result_image.save(result_path, 'JPEG', quality=95)
            
            with task_lock:
                task_status[task_id] = {
                    'status': 'completed',
                    'progress': 100,
                    'result': f"{task_id}.jpg"
                }
                
        except Exception as e:
            with task_lock:
                task_status[task_id] = {
                    'status': 'error',
                    'progress': 0,
                    'error': str(e)
                }
        finally:
            task_queue.task_done()

worker_thread = threading.Thread(target=worker, daemon=True)
worker_thread.start()

@app.route('/api/styles', methods=['GET'])
def list_styles():
    styles = get_style_list()
    return jsonify({
        'success': True,
        'styles': styles
    })

@app.route('/api/styles/<style_key>/image', methods=['GET'])
def get_style_preview(style_key):
    style_data = get_style_image(style_key)
    if style_data is None:
        return jsonify({'success': False, 'error': 'Style not found'}), 404
    
    from flask import make_response
    response = make_response(style_data)
    response.headers.set('Content-Type', 'image/jpeg')
    return response

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': 'No image file'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    
    task_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{task_id}_content.jpg")
    file.save(file_path)
    
    return jsonify({
        'success': True,
        'task_id': task_id,
        'message': 'Image uploaded successfully'
    })

@app.route('/api/transfer', methods=['POST'])
def start_transfer():
    data = request.json
    task_id = data.get('task_id')
    style_key = data.get('style_key')
    num_steps = data.get('num_steps', 200)
    
    content_path = os.path.join(UPLOAD_DIR, f"{task_id}_content.jpg")
    if not os.path.exists(content_path):
        return jsonify({'success': False, 'error': 'Content image not found'}), 404
    
    with open(content_path, 'rb') as f:
        content_data = f.read()
    
    task_queue.put((task_id, content_data, style_key, num_steps))
    
    with task_lock:
        task_status[task_id] = {
            'status': 'queued',
            'progress': 0,
            'position': task_queue.qsize()
        }
    
    return jsonify({
        'success': True,
        'task_id': task_id,
        'message': 'Task queued successfully'
    })

@app.route('/api/status/<task_id>', methods=['GET'])
def get_status(task_id):
    with task_lock:
        status = task_status.get(task_id, {
            'status': 'not_found',
            'progress': 0
        })
    
    return jsonify({
        'success': True,
        'task_id': task_id,
        **status
    })

@app.route('/api/result/<filename>', methods=['GET'])
def get_result(filename):
    return send_from_directory(RESULT_DIR, filename)

@app.route('/api/queue/status', methods=['GET'])
def queue_status():
    return jsonify({
        'success': True,
        'queue_size': task_queue.qsize()
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'status': 'healthy',
        'model_loaded': model_instance is not None
    })

if __name__ == '__main__':
    generate_sample_style_images()
    app.run(host='0.0.0.0', port=5000, debug=False)
