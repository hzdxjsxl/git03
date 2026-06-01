from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from autograd import Value
from nn import ValueMLP


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('index.html', 'rb') as f:
                self.wfile.write(f.read())
        elif self.path == '/train-stream':
            self.handle_train_stream()
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/train':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            result = train_and_return()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_train_stream(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST')
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
            report_interval = 50
            
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
                    event_data = {
                        'epoch': epoch,
                        'loss': total_loss.data,
                        'status': 'training'
                    }
                    try:
                        self.wfile.write(f'data: {json.dumps(event_data)}\n\n'.encode())
                        self.wfile.flush()
                    except Exception as e:
                        print(f"Client disconnected: {e}")
                        return
                
                time.sleep(0.001)
            
            test_input = [Value(0), Value(0)]
            pred = model(test_input)
            graph_data = pred.get_graph_data()
            
            final_event = {
                'epoch': epochs,
                'loss': 0,
                'status': 'completed',
                'graphData': graph_data
            }
            
            try:
                self.wfile.write(f'data: {json.dumps(final_event)}\n\n'.encode())
                self.wfile.flush()
            except Exception as e:
                print(f"Failed to send final data: {e}")
            
        except Exception as e:
            print(f"Error in stream handler: {e}")
    
    def log_message(self, format, *args):
        return


def train_and_return():
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
    losses = []
    
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
        
        if epoch % 10 == 0:
            losses.append(total_loss.data)
    
    test_input = [Value(0), Value(0)]
    pred = model(test_input)
    graph_data = pred.get_graph_data()
    
    return {
        'graphData': graph_data,
        'losses': losses,
        'message': 'Training completed successfully'
    }


def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, RequestHandler)
    print('Server running on http://localhost:8000')
    httpd.serve_forever()


if __name__ == '__main__':
    run_server()