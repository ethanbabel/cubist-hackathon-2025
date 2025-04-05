import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class TollPredictor(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Linear(2, 32),
            nn.ReLU(),  # Optional, helps training
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1)  # No final activation
        )

    def forward(self, x):
        return self.model(x)

class DifferentiableCongestion(nn.Module):
    def __init__(self, congestion_base=1.2, threshold=9.0, sharpness=2.0):
        """
        Args:
            congestion_base: Max congestion level before toll effects.
            threshold: Toll value where congestion begins to significantly drop.
            sharpness: Controls the steepness of the sigmoid-like decay.
        """
        super().__init__()
        self.congestion_base = congestion_base
        self.threshold = threshold
        self.sharpness = sharpness

    def forward(self, local_congestion, global_congestion, toll):
        base = self.congestion_base * (0.5 * local_congestion + 0.5 * global_congestion)
        decay = 1 + torch.exp((toll - self.threshold) / self.sharpness)
        congestion = base / decay
        return congestion  # ⚠️ no clamp – allow model to learn via penalty

def simulate_inputs(n_samples=10000, seed=42):
    torch.manual_seed(seed)
    local = torch.rand(n_samples) * 0.8 + 0.2
    global_ = torch.rand(n_samples) * 0.8 + 0.2
    return torch.stack([local, global_], dim=1)

def train_model(
    penalty_weight=1_000_000.0,
    threshold=0.3,
    epochs=300,
    batch_size=64,
    lr=0.001,
    save_path="trained_model.pt"
):
    model = TollPredictor()
    congestion_model = DifferentiableCongestion()
    optimizer = optim.Adam(list(model.parameters()) + list(congestion_model.parameters()), lr=lr)

    X = simulate_inputs()
    dataset = DataLoader(TensorDataset(X), batch_size=batch_size, shuffle=True)

    for epoch in range(epochs):
        total_loss = 0
        for batch in dataset:
            inputs = batch[0]
            raw_output = model(inputs).squeeze()

            # 🧠 Scale with tanh: [-1, 1] → [0, 1] → [2.25, 18.0]
            scaled = (torch.tanh(raw_output) + 1) / 2
            tolls = 2.25 + (18.0 - 2.25) * scaled

            local = inputs[:, 0]
            global_ = inputs[:, 1]
            congestion = congestion_model(local, global_, tolls)

            penalty = torch.clamp(congestion - threshold, min=0.0)
            penalty_loss = (penalty ** 2).mean()
            loss = tolls.mean() + penalty_weight * penalty_loss

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if epoch % 50 == 0:
            print(
                f"Epoch {epoch} | Loss: {total_loss:.4f} | "
                f"Avg Toll: {tolls.mean().item():.2f} | "
                f"Avg Congestion: {congestion.mean().item():.2f} | "
                f"Penalty Loss: {penalty_loss.item():.4f}"
            )

    torch.save(model.state_dict(), save_path)
    print(f"✅ Model saved to {save_path}")

    # 📊 Save plot of congestion response curve
    import matplotlib.pyplot as plt

    local = torch.tensor([0.6])
    global_ = torch.tensor([0.6])
    tolls = torch.linspace(2.25, 18.0, steps=100)
    congestion_model = DifferentiableCongestion()

    with torch.no_grad():
        congestion = congestion_model(local.expand_as(tolls), global_.expand_as(tolls), tolls)

    plt.plot(tolls, congestion)
    plt.xlabel("Toll")
    plt.ylabel("Congestion")
    plt.title("Congestion vs Toll")
    plt.grid(True)
    plt.savefig("congestion_vs_toll.png")

def load_model_and_predict():
    model = TollPredictor()
    model.load_state_dict(torch.load("trained_model.pt"))
    model.eval()

    def predict(local_congestion, global_congestion):
        import torch
        with torch.no_grad():
            input_tensor = torch.tensor([[local_congestion, global_congestion]], dtype=torch.float32)
            output = model(input_tensor).item()
        return round(output, 2)

    return predict

def load_model_and_predict():
    model = TollPredictor()
    model.load_state_dict(torch.load("trained_model.pt"))
    model.eval()

    def predict(local_congestion, global_congestion):
        with torch.no_grad():
            input_tensor = torch.tensor([[local_congestion, global_congestion]], dtype=torch.float32)
            raw_output = model(input_tensor)
            # Apply tanh scaling
            scaled = (torch.tanh(raw_output) + 1) / 2
            toll = scaled * (18.00 - 2.25) + 2.25
            return round(toll.item(), 2)

    return predict