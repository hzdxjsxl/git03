from autograd import Value, Matrix
import random


class Layer:
    def __init__(self, in_features: int, out_features: int, activation: str = 'sigmoid', label: str = ''):
        self.in_features = in_features
        self.out_features = out_features
        self.activation = activation
        self.label = label
        
        self.W = Matrix.random(in_features, out_features, label=f'{label}.W')
        self.b = Matrix.zeros(1, out_features, label=f'{label}.b')
        
        self.params = [self.W, self.b]
    
    def __call__(self, x: Matrix):
        z = x * self.W + self.b
        z.label = f'{self.label}.z'
        
        if self.activation == 'sigmoid':
            out = z.sigmoid()
        elif self.activation == 'tanh':
            out = z.tanh()
        elif self.activation == 'relu':
            out = z.relu()
        else:
            out = z
        
        out.label = f'{self.label}.out'
        return out
    
    def zero_grad(self):
        for param in self.params:
            param.grad = [[0.0 for _ in range(param.cols)] for _ in range(param.rows)]
    
    def update(self, lr: float):
        for param in self.params:
            for i in range(param.rows):
                for j in range(param.cols):
                    param.data[i][j] -= lr * param.grad[i][j]


class Model:
    def __init__(self):
        self.layers = []
    
    def add_layer(self, layer: Layer):
        self.layers.append(layer)
    
    def __call__(self, x: Matrix):
        out = x
        for layer in self.layers:
            out = layer(out)
        return out
    
    def zero_grad(self):
        for layer in self.layers:
            layer.zero_grad()
    
    def update(self, lr: float):
        for layer in self.layers:
            layer.update(lr)
    
    def get_params(self):
        params = []
        for layer in self.layers:
            params.extend(layer.params)
        return params
    
    def get_graph_data(self, x: Matrix):
        out = self(x)
        if isinstance(out, Matrix):
            return out.get_graph_data()
        elif isinstance(out, Value):
            return out.get_graph_data()


class MLP(Model):
    def __init__(self, layers: list, activations: list = None):
        super().__init__()
        if activations is None:
            activations = ['sigmoid'] * (len(layers) - 1)
        
        for i in range(len(layers) - 1):
            activation = activations[i] if i < len(activations) else 'sigmoid'
            layer = Layer(layers[i], layers[i+1], activation, label=f'Layer{i+1}')
            self.add_layer(layer)


class ValueNeuron:
    def __init__(self, nin: int, activation: str = 'sigmoid', label: str = ''):
        self.w = [Value(random.uniform(-1, 1), label=f'{label}.w{i}') for i in range(nin)]
        self.b = Value(random.uniform(-1, 1), label=f'{label}.b')
        self.activation = activation
        self.label = label
        self.params = self.w + [self.b]
    
    def __call__(self, x):
        act = sum(wi * xi for wi, xi in zip(self.w, x)) + self.b
        if self.activation == 'sigmoid':
            out = act.sigmoid()
        elif self.activation == 'tanh':
            out = act.tanh()
        elif self.activation == 'relu':
            out = act.relu()
        else:
            out = act
        out.label = f'{self.label}.out'
        return out
    
    def zero_grad(self):
        for p in self.params:
            p.grad = 0.0
    
    def update(self, lr: float):
        for p in self.params:
            p.data -= lr * p.grad


class ValueMLP:
    def __init__(self, layers: list, activations: list = None):
        if activations is None:
            activations = ['sigmoid'] * (len(layers) - 1)
        
        self.layers = []
        for i in range(len(layers) - 1):
            activation = activations[i] if i < len(activations) else 'sigmoid'
            neurons = [ValueNeuron(layers[i], activation, label=f'L{i+1}.N{j}') for j in range(layers[i+1])]
            self.layers.append(neurons)
        
        self.params = []
        for layer in self.layers:
            for neuron in layer:
                self.params.extend(neuron.params)
    
    def __call__(self, x):
        out = x
        for layer in self.layers:
            out = [neuron(out) for neuron in layer]
        return out[0] if len(out) == 1 else out
    
    def zero_grad(self):
        for p in self.params:
            p.grad = 0.0
    
    def update(self, lr: float):
        for p in self.params:
            p.data -= lr * p.grad
    
    def get_graph_data(self, x):
        out = self(x)
        if isinstance(out, Value):
            return out.get_graph_data()
        elif isinstance(out, list):
            combined_nodes = []
            combined_edges = []
            visited = set()
            
            for val in out:
                graph_data = val.get_graph_data()
                for node in graph_data['nodes']:
                    if node['id'] not in visited:
                        visited.add(node['id'])
                        combined_nodes.append(node)
                for edge in graph_data['edges']:
                    combined_edges.append(edge)
            return {'nodes': combined_nodes, 'edges': combined_edges}
        return {'nodes': [], 'edges': []}