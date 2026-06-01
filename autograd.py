import math
from typing import List, Optional, Callable


class Value:
    def __init__(self, data: float, _children: tuple = (), _op: str = '', label: str = ''):
        self.data = data
        self.grad = 0.0
        self._backward: Callable[[], None] = lambda: None
        self._prev = set(_children)
        self._op = _op
        self.label = label
        self.id = id(self)

    def __repr__(self):
        return f"Value(data={self.data}, grad={self.grad}, label='{self.label}')"

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), '+')

        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), '*')

        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def __pow__(self, other):
        assert isinstance(other, (int, float)), "only supporting int/float powers for now"
        out = Value(self.data ** other, (self,), f'**{other}')

        def _backward():
            self.grad += (other * self.data ** (other - 1)) * out.grad
        out._backward = _backward
        return out

    def __neg__(self):
        return self * -1

    def __sub__(self, other):
        return self + (-other)

    def __truediv__(self, other):
        return self * (other ** -1)

    def __radd__(self, other):
        return self + other

    def __rmul__(self, other):
        return self * other

    def __rsub__(self, other):
        return other + (-self)

    def __rtruediv__(self, other):
        return other * (self ** -1)

    def tanh(self):
        x = self.data
        t = (math.exp(2*x) - 1) / (math.exp(2*x) + 1)
        out = Value(t, (self,), 'tanh')

        def _backward():
            self.grad += (1 - t**2) * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0, self.data), (self,), 'ReLU')

        def _backward():
            self.grad += (out.data > 0) * out.grad
        out._backward = _backward
        return out

    def sigmoid(self):
        x = self.data
        s = 1 / (1 + math.exp(-x))
        out = Value(s, (self,), 'sigmoid')

        def _backward():
            self.grad += s * (1 - s) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visited = set()

        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
        build_topo(self)

        self.grad = 1.0
        for v in reversed(topo):
            v._backward()

    def get_graph_data(self):
        nodes = []
        edges = []
        visited = set()

        def build_graph(v):
            if v not in visited:
                visited.add(v)
                nodes.append({
                    'id': v.id,
                    'data': round(v.data, 4),
                    'grad': round(v.grad, 4),
                    'op': v._op,
                    'label': v.label
                })
                for child in v._prev:
                    edges.append({'from': child.id, 'to': v.id})
                    build_graph(child)
        build_graph(self)
        return {'nodes': nodes, 'edges': edges}


class Matrix:
    def __init__(self, data: List[List[float]], _children: tuple = (), _op: str = '', label: str = ''):
        self.data = data
        self.rows = len(data)
        self.cols = len(data[0]) if self.rows > 0 else 0
        self.grad = [[0.0 for _ in range(self.cols)] for _ in range(self.rows)]
        self._backward: Callable[[], None] = lambda: None
        self._prev = set(_children)
        self._op = _op
        self.label = label
        self.id = id(self)

    def __repr__(self):
        return f"Matrix(rows={self.rows}, cols={self.cols}, label='{self.label}')"

    def __add__(self, other):
        if isinstance(other, Matrix):
            assert self.rows == other.rows and self.cols == other.cols
            data = [[self.data[i][j] + other.data[i][j] for j in range(self.cols)] for i in range(self.rows)]
            out = Matrix(data, (self, other), '+', self.label + '+' + other.label)

            def _backward():
                for i in range(self.rows):
                    for j in range(self.cols):
                        self.grad[i][j] += out.grad[i][j]
                        other.grad[i][j] += out.grad[i][j]
            out._backward = _backward
            return out
        else:
            data = [[self.data[i][j] + other for j in range(self.cols)] for i in range(self.rows)]
            out = Matrix(data, (self,), f'+{other}', self.label + f'+{other}')

            def _backward():
                for i in range(self.rows):
                    for j in range(self.cols):
                        self.grad[i][j] += out.grad[i][j]
            out._backward = _backward
            return out

    def __mul__(self, other):
        if isinstance(other, Matrix):
            assert self.cols == other.rows
            data = [[sum(self.data[i][k] * other.data[k][j] for k in range(self.cols)) for j in range(other.cols)] for i in range(self.rows)]
            out = Matrix(data, (self, other), '@', self.label + '@' + other.label)

            def _backward():
                for i in range(self.rows):
                    for k in range(self.cols):
                        for j in range(other.cols):
                            self.grad[i][k] += other.data[k][j] * out.grad[i][j]
                            other.grad[k][j] += self.data[i][k] * out.grad[i][j]
            out._backward = _backward
            return out
        else:
            data = [[self.data[i][j] * other for j in range(self.cols)] for i in range(self.rows)]
            out = Matrix(data, (self,), f'*{other}', self.label + f'*{other}')

            def _backward():
                for i in range(self.rows):
                    for j in range(self.cols):
                        self.grad[i][j] += other * out.grad[i][j]
            out._backward = _backward
            return out

    def __sub__(self, other):
        return self + (-other)

    def __neg__(self):
        return self * -1

    def __radd__(self, other):
        return self + other

    def __rmul__(self, other):
        return self * other

    def transpose(self):
        data = [[self.data[j][i] for j in range(self.rows)] for i in range(self.cols)]
        out = Matrix(data, (self,), 'T', self.label + '^T')

        def _backward():
            for i in range(self.rows):
                for j in range(self.cols):
                    self.grad[i][j] += out.grad[j][i]
        out._backward = _backward
        return out

    def tanh(self):
        data = [[math.tanh(self.data[i][j]) for j in range(self.cols)] for i in range(self.rows)]
        out = Matrix(data, (self,), 'tanh', self.label + '.tanh()')

        def _backward():
            for i in range(self.rows):
                for j in range(self.cols):
                    self.grad[i][j] += (1 - out.data[i][j] ** 2) * out.grad[i][j]
        out._backward = _backward
        return out

    def relu(self):
        data = [[max(0, self.data[i][j]) for j in range(self.cols)] for i in range(self.rows)]
        out = Matrix(data, (self,), 'ReLU', self.label + '.relu()')

        def _backward():
            for i in range(self.rows):
                for j in range(self.cols):
                    self.grad[i][j] += (out.data[i][j] > 0) * out.grad[i][j]
        out._backward = _backward
        return out

    def sigmoid(self):
        data = [[1 / (1 + math.exp(-self.data[i][j])) for j in range(self.cols)] for i in range(self.rows)]
        out = Matrix(data, (self,), 'sigmoid', self.label + '.sigmoid()')

        def _backward():
            for i in range(self.rows):
                for j in range(self.cols):
                    s = out.data[i][j]
                    self.grad[i][j] += s * (1 - s) * out.grad[i][j]
        out._backward = _backward
        return out

    def sum(self):
        total = sum(sum(row) for row in self.data)
        out = Value(total, (self,), 'sum', self.label + '.sum()')

        def _backward():
            for i in range(self.rows):
                for j in range(self.cols):
                    self.grad[i][j] += out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visited = set()

        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
        build_topo(self)

        self.grad = [[1.0 for _ in range(self.cols)] for _ in range(self.rows)]
        for v in reversed(topo):
            v._backward()

    def get_graph_data(self):
        nodes = []
        edges = []
        visited = set()

        def build_graph(v):
            if v not in visited:
                visited.add(v)
                nodes.append({
                    'id': v.id,
                    'rows': v.rows,
                    'cols': v.cols,
                    'data': str(v.data),
                    'op': v._op,
                    'label': v.label
                })
                for child in v._prev:
                    edges.append({'from': child.id, 'to': v.id})
                    build_graph(child)
        build_graph(self)
        return {'nodes': nodes, 'edges': edges}

    @staticmethod
    def zeros(rows: int, cols: int, label: str = ''):
        return Matrix([[0.0 for _ in range(cols)] for _ in range(rows)], label=label)

    @staticmethod
    def random(rows: int, cols: int, label: str = ''):
        import random
        return Matrix([[random.uniform(-1, 1) for _ in range(cols)] for _ in range(rows)], label=label)