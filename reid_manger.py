import torch
import torchreid
from torchvision import transforms

def embedding_model():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    reid_model = torchreid.models.build_model(
        name='osnet_x1_0',
        num_classes=1000,
        pretrained=True
    )
    reid_model.eval()
    reid_model.to(device)

    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((256, 128)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225])
    ])

    return reid_model, transform
