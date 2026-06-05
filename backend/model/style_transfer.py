import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
import torchvision.transforms as transforms
import torchvision.models as models
from io import BytesIO
import os

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class ContentLoss(nn.Module):
    def __init__(self, target,):
        super(ContentLoss, self).__init__()
        self.target = target.detach()

    def forward(self, input):
        self.loss = nn.functional.mse_loss(input, self.target)
        return input

class StyleLoss(nn.Module):
    def __init__(self, target_feature):
        super(StyleLoss, self).__init__()
        self.target = self.gram_matrix(target_feature).detach()

    def forward(self, input):
        G = self.gram_matrix(input)
        self.loss = nn.functional.mse_loss(G, self.target)
        return input

    @staticmethod
    def gram_matrix(input):
        a, b, c, d = input.size()
        features = input.view(a * b, c * d)
        G = torch.mm(features, features.t())
        return G.div(a * b * c * d)

class Normalization(nn.Module):
    def __init__(self, mean, std):
        super(Normalization, self).__init__()
        self.mean = torch.tensor(mean).view(-1, 1, 1)
        self.std = torch.tensor(std).view(-1, 1, 1)

    def forward(self, img):
        return (img - self.mean) / self.std

class StyleTransferModel:
    def __init__(self):
        self.cnn = models.vgg19(pretrained=True).features.to(device).eval()
        self.content_layers_default = ['conv_3', 'conv_4', 'conv_5']
        self.style_layers_default = ['conv_1', 'conv_2', 'conv_3', 'conv_4', 'conv_5']
        self.cnn_normalization_mean = torch.tensor([0.485, 0.456, 0.406]).to(device)
        self.cnn_normalization_std = torch.tensor([0.229, 0.224, 0.225]).to(device)
        self.imsize = 512 if torch.cuda.is_available() else 384

    def load_image(self, image_data, max_size=None):
        if max_size is None:
            max_size = self.imsize
            
        image = Image.open(BytesIO(image_data)).convert('RGB')
        
        w, h = image.size
        if max(w, h) > max_size:
            scale = max_size / max(w, h)
            new_w = int(w * scale)
            new_h = int(h * scale)
            image = image.resize((new_w, new_h), Image.LANCZOS)
        
        loader = transforms.Compose([
            transforms.ToTensor()])
        
        image = loader(image).unsqueeze(0)
        return image.to(device, torch.float)

    def get_style_model_and_losses(self, style_img, content_img):
        normalization = Normalization(self.cnn_normalization_mean, self.cnn_normalization_std).to(device)
        
        content_losses = []
        style_losses = []
        
        model = nn.Sequential(normalization)
        
        i = 0
        for layer in self.cnn.children():
            if isinstance(layer, nn.Conv2d):
                i += 1
                name = 'conv_{}'.format(i)
            elif isinstance(layer, nn.ReLU):
                name = 'relu_{}'.format(i)
                layer = nn.ReLU(inplace=False)
            elif isinstance(layer, nn.MaxPool2d):
                name = 'pool_{}'.format(i)
                layer = nn.AvgPool2d(kernel_size=2, stride=2)
            elif isinstance(layer, nn.BatchNorm2d):
                name = 'bn_{}'.format(i)
            else:
                continue

            model.add_module(name, layer)

            if name in self.content_layers_default:
                target = model(content_img).detach()
                content_loss = ContentLoss(target)
                model.add_module("content_loss_{}".format(i), content_loss)
                content_losses.append(content_loss)

            if name in self.style_layers_default:
                target_feature = model(style_img).detach()
                style_loss = StyleLoss(target_feature)
                model.add_module("style_loss_{}".format(i), style_loss)
                style_losses.append(style_loss)

        for i in range(len(model) - 1, -1, -1):
            if isinstance(model[i], ContentLoss) or isinstance(model[i], StyleLoss):
                break

        model = model[:(i + 1)]
        return model, style_losses, content_losses

    def transfer_style(self, content_image_data, style_image_data, num_steps=300, style_weight=1e5, content_weight=1e0, progress_callback=None):
        content_img = self.load_image(content_image_data)
        style_img = self.load_image(style_image_data, max_size=content_img.size(2))
        
        style_img = nn.functional.interpolate(style_img, size=(content_img.size(2), content_img.size(3)), mode='bilinear', align_corners=False)
        
        input_img = content_img.clone()
        
        model, style_losses, content_losses = self.get_style_model_and_losses(style_img, content_img)
        
        input_img.requires_grad_(True)
        model.requires_grad_(False)
        
        optimizer = optim.LBFGS([input_img], max_iter=20)
        
        run = [0]
        best_loss = float('inf')
        best_img = None
        
        while run[0] <= num_steps:
            def closure():
                with torch.no_grad():
                    input_img.clamp_(0, 1)

                optimizer.zero_grad()
                model(input_img)
                style_score = 0
                content_score = 0

                for sl in style_losses:
                    style_score += sl.loss
                for cl in content_losses:
                    content_score += cl.loss

                style_score *= style_weight
                content_score *= content_weight

                loss = style_score + content_score
                loss.backward()

                run[0] += 1
                if progress_callback and run[0] % 3 == 0:
                    progress = int((run[0] / num_steps) * 100)
                    progress_callback(min(progress, 100))

                return loss

            optimizer.step(closure)

        with torch.no_grad():
            input_img.clamp_(0, 1)

        return self.tensor_to_image(input_img)

    def tensor_to_image(self, tensor):
        image = tensor.cpu().clone()
        image = image.squeeze(0)
        unloader = transforms.ToPILImage()
        image = unloader(image)
        return image
