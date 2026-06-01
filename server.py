from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os

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
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/train':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            model, losses, X = train_xor()
            
            test_input = [Value(0), Value(0)]
            pred = model(test_input)
            graph_data = pred.get_graph_data()
            
            response = {
                'graphData': graph_data,
                'losses': losses,
                'message': 'Training completed successfully'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        return


def train_xor():
    model = ValueMLP([2, 4, 1], activations=['sigmoid', 'sigmoid'])
    
    X = [
        [Value(0, label='x0'), Value(0, label='x1')],
        [Value(0, label='x0'), Value(1, label='x1')],
        [Value(1, label='x0'), Value(0, label='x1')],
        [Value(1, label='x0'), Value(1, label='x1')]
    ]
    y = [0, 1, 1, 0]
    
    epochs = 5000
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
    
    return model, losses, X


def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, RequestHandler)
    print('Server running on http://localhost:8000')
    httpd.serve_forever()


if __name__ == '__main__':
    run_server()