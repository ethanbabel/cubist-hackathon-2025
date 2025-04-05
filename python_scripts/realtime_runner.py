import torch
from toll_model import TollPredictor
from tomtom import fetch_realtime_entry_scores, fetch_crz_global_score

def load_model(model_path="trained_model.pt"):
    model = TollPredictor()
    model.load_state_dict(torch.load(model_path))
    model.eval()
    return model

def predict_toll(model, local, global_):
    x = torch.tensor([[local, global_]], dtype=torch.float32)
    with torch.no_grad():
        raw_output = model(x).item()
        normalized = torch.tanh(torch.tensor(raw_output))  # output in (-1, 1)
        scaled = (normalized + 1) / 2  # now in (0, 1)
        toll = 2.25 + (18.0 - 2.25) * scaled.item()
    return toll

def run_realtime():
    print("🌐 Starting real-time toll predictions...")

    entry_points = [
        "Brooklyn Bridge", "West Side Highway at 60th St", "West 60th St",
        "Queensboro Bridge", "Queens Midtown Tunnel", "Lincoln Tunnel",
        "Holland Tunnel", "FDR Drive at 60th St", "East 60th St",
        "Williamsburg Bridge", "Manhattan Bridge", "Hugh L. Carey Tunnel"
    ]

    model = load_model()
    global_congestion = fetch_crz_global_score()
    local_congestions = fetch_realtime_entry_scores()

    print(f"Global CRZ Congestion: {global_congestion:.2f}\n")

    for entry in entry_points:
        local_congestion = local_congestions.get(entry, 0.0)
        toll = predict_toll(model, local_congestion, global_congestion)
        print(f"{entry:25} | Local: {local_congestion:.2f} | Toll: ${toll:.2f}")

if __name__ == "__main__":
    run_realtime()