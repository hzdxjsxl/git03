from autograd import Value
from nn import ValueMLP


def train_xor():
    print("=== 训练异或门网络 ===")
    
    model = ValueMLP([2, 4, 1], activations=['sigmoid', 'sigmoid'])
    
    X = [
        [Value(0, label='x0'), Value(0, label='x1')],
        [Value(0, label='x0'), Value(1, label='x1')],
        [Value(1, label='x0'), Value(0, label='x1')],
        [Value(1, label='x0'), Value(1, label='x1')]
    ]
    y = [0, 1, 1, 0]
    
    epochs = 10000
    lr = 0.5
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
        
        losses.append(total_loss.data)
        
        if (epoch + 1) % 1000 == 0:
            print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss.data:.6f}")
    
    print("\n=== 测试结果 ===")
    for i in range(4):
        pred = model(X[i])
        print(f"XOR({X[i][0].data}, {X[i][1].data}) = {pred.data:.4f} (目标: {y[i]})")
    
    return model, losses, X


if __name__ == '__main__':
    model, losses, X = train_xor()
    
    print("\n=== 网络参数 ===")
    for i, param in enumerate(model.params):
        print(f"参数{i}: data={param.data:.4f}, grad={param.grad:.4f}, label={param.label}")
    
    print("\n=== 损失值变化趋势 ===")
    print("初始损失:", losses[0])
    print("最终损失:", losses[-1])
    print("损失下降比例:", (losses[0] - losses[-1]) / losses[0] * 100, "%")