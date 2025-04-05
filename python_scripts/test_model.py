import torch
from toll_model import TollPredictor

def test_model(model_path="trained_model.pt"):
    model = TollPredictor()
    model.load_state_dict(torch.load(model_path))
    model.eval()

    test_inputs = {
        "Brooklyn Bridge": (0.5, 0.5),
        "West Side Highway at 60th St": (0.6, 0.4),
        "West 60th St": (0.7, 0.3), 
        "Queensboro Bridge": (0.8, 0.2),
        "Queens Midtown Tunnel": (0.9, 0.1),
        "Lincoln Tunnel": (0.4, 0.6),
        "Holland Tunnel": (0.3, 0.7),
        "FDR Drive at 60th St": (0.2, 0.8),
        "East 60th St": (0.1, 0.9),
        "Williamsburg Bridge": (0.0, 0.0),
        "Manhattan Bridge": (1.0, 1.0),
        "Hugh L. Carey Tunnel": (0.7, 0.7),
    }

    print("🧪 Model Toll Predictions for Given Congestion Levels\n")
    for local, global_ in test_inputs.values():
        x = torch.tensor([[local, global_]], dtype=torch.float32)
        with torch.no_grad():
            raw_output = model(x).item()
            sigmoid_output = torch.sigmoid(torch.tensor(raw_output))
            toll = 2.25 + (18.0 - 2.25) * sigmoid_output.item()
        print(f"Local: {local:.2f} | Global: {global_:.2f} → Predicted Toll: ${toll:.2f}")

if __name__ == "__main__":
    test_model()