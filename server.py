from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from autograd import Value
from nn import ValueMLP

current_training_data = None
training_lock = threading.Lock()


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('index.html', 'rb') as f:
                self.wfile.write(f.read())
        elif self.path == '/check-training':
            self.handle_check_training()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/start-training':
            self.handle_start_training()
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_start_training(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            model = ValueMLP([2, 4, 1], activations=['sigmoid', 'sigmoid'])
            
            X = [
                [Value(0, label='x0'), Value(0, label='x1')],
                [Value(0, label='x0'), Value(1, label='x1')],
                [Value(1, label='x0'), Value(0, label='x1')],
                [Value(1, label='x0'), Value(1, label='x1')]
            ]
            y = [0, 1, 1, 0]
            
            epochs = 2000
            lr = 0.8
            report_interval = 20
            
            for epoch in range(epochs):
                model.zero_grad()
                
                total_loss = Value(0, label='total_loss')
                
                for i in range(4):
                    pred = model(X[i])
                    target = Value(y[i], label=f'y{i}')
                    loss = (pred - target) ** 2
                    loss.label = f'loss{i}'
                    total_loss = total_loss + loss
                
                total_loss = total_loss * (1/4)
                total_loss.label = 'avg_loss'
                
                total_loss.backward()
                model.update(lr)
                
                if epoch % report_interval == 0:
                    event_data = json.dumps({
                        'type': 'progress',
                        'epoch': epoch,
                        'loss': total_loss.data,
                        'max_epochs': epochs
                    })
                    try:
                        self.wfile.write(f'data: {event_data}\n\n'.encode())
                        self.wfile.flush()
                    except Exception as e:
                        print(f"Client disconnected during training: {e}")
                        return
            
            test_input = [Value(0), Value(0)]
            pred = model(test_input)
            graph_data = pred.get_graph_data()
            
            final_event = json.dumps({
                'type': 'completed',
                'graphData': graph_data
            })
            
            try:
                self.wfile.write(f'data: {final_event}\n\n'.encode())
                self.wfile.flush()
            except Exception as e:
                print(f"Failed to send final data: {e}")
                
        except Exception as e:
            error_event = json.dumps({
                'type': 'error',
                'message': str(e)
            })
            try:
                self.wfile.write(f'data: {error_event}\n\n'.encode())
                self.wfile.flush()
            except:
                pass
            print(f"Error in training: {e}")
    
    def handle_check_training(self):
        global current_training_data
        with training_lock:
            data = current_training_data if current_training_data else {'status': 'idle'}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        return


def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, RequestHandler)
    print('Server running on http://localhost:8000')
    httpd.serve_forever()


if __name__ == '__main__':
    run_server()