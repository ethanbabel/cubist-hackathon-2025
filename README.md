Access our App Here: https://a309-2600-387-c-7016-00-1.ngrok-free.app

## MTA Congestion Pricing Analysis and Visualization Tool

This project integrates Vanna (an AI-powered query tool) and Perspective (a data visualization library) to analyze and visualize MTA congestion pricing data. Users can query detailed information about congestion pricing policies, traffic data, and related metrics, and explore the results in a rich, interactive format.

## Table of Contents
Features
Setup Instructions
Usage
Data Visualization
Interactive Map
Graphs & Charts
Contributing
License

## Features 
### AI-Powered Data Querying:
Utilize Vanna to ask natural language questions about congestion pricing, MTA-related traffic data, or any other relevant metrics. Vanna responds with relevant insights and answers in real-time.
### Easy Auto-Charting:
Ask natural language questions about traffic data and instantly get AI-generated, interactive charts and visualizations.
### Interactive Data Visualizations:
Leverage Perspective, a powerful data visualization library, to explore the data interactively. This includes dynamic tables, graphs, charts, and dashboards that can be customized and filtered based on user input.
### Zone Density Map:
Visualize traffic density across different MTA zones at various times. This provides an overview of traffic patterns and congestion in real-time.
### Real-time Traffic Analysis:
View real-time traffic trends and congestion levels across different MTA zones with interactive graphs.
## Modeling Toll Pricing for Congestion Management

**Objective**

The goal of the congestion model is to determine optimal congestion tolls for each entry point into the Manhattan Central Business District that are dynamically adjusted, both:
- Locally: at the specific entry point, and
- Globally: across the entire Central Residential Zone (CRZ)

The model is designed to set the lowest tolls possible while maintaining congestion below a defined threshold (e.g., 0.3). This ensures traffic flow and accessibility without unnecessarily overpricing entry.

**What Is the Congestion Score?**

Congestion score is defined as follows:
```math
\text{congestion} = 1 - \frac{\text{currentFlowRate}}{\text{freeFlowRate}}
```
where the current flow rate and free flow rate (of traffic) are pulled from a real-time traffic API (TomTom). Therefore
- 0.0 = completely free-flowing traffic
- 1.0 = total gridlock

Global congestion is measured as the average of sampled CRZ locations. Local congestion is computed per-entry-point. 

**Modeling Approach**

We used differentiable supervised learning model trained on simulated data that mimics driver responses to toll levels.

Key Components
- Multilayer Perceptron (MLP): A feedforward neural network that takes inputs (local_congestion, global_congestion) and outputs a predicted toll.
- Differentiable Congestion Model: A fixed simulation function that predicts congestion given tolls, designed to allow gradients to flow back through toll decisions.
- Custom Loss Function:
```math
\text{Loss} = \text{Mean(Tolls)} + \lambda \cdot \max(0, \text{congestion} - \text{threshold})^2
```

We tuned:
- λ = 1e6 (penalty weight)
- threshold = 0.3

This incentivizes setting the lowest possible tolls while avoiding excess congestion.

**Toll Response Congestion Modeling**

Economic theory and empirical studies show that demand for urban travel is price elastic, meaning that as tolls rise, fewer vehicles enter, reducing congestion. The relationship is nonlinear, especially near behavioral tipping points.
We used a differentiable sigmoid-like function to model this shape:
```math
\text{congestion} = \frac{\text{base}}{1 + \exp(k \cdot (\text{toll} - \theta))}
```

Where:
- base is the max congestion if tolls are free.
- θ is the inflection point. 
- k controls steepness.

The congestion model is fixed and does not learn — it merely simulates driver behavior in response to tolling.
=======
# cubist-hackathon-2025

## Setup Instructions

Prerequisites
Before you start, make sure you have the following installed:

Python 3.x

1. Clone the repository
git clone https://github.com/ethanbabel/cubist-hackathon-2025.git
cd cubist-hackathon-2025

2. Install dependencies
For the backend (Vanna integration), run:

pip install -r requirements.txt

3. Start the server
Run the following command to start the local server:

python3 -m http.server
This will start the server at localhost:8000.

## Usage

Open your web browser and go to http://localhost:8000/index.html.
Use Vanna, the AI chatbot, to ask questions related to congestion pricing, such as:
"What is the congestion pricing in Zone A?"
"How has traffic changed in Zone B over the past month?"
Interact with the interactive map to view congestion levels across different zones.
Explore the different graphs and charts (once implemented) for detailed traffic data analysis.

## Data Visualization

### Interactive Map 
This feature displays a map of MTA zones with traffic density data shown at various time intervals. The map allows users to zoom in on specific areas and see how congestion levels change in real-time.

Zones: Traffic data is segmented by zone.
Time Interval: View congestion levels at different times of the day.

### Graphs & Charts
Graphs and charts are created using Perspective and will allow for detailed analysis of the MTA data. These interactive graphs will provide insights such as:

Traffic Trends: Track how traffic congestion evolves over time.
Comparative Data: Compare traffic between different zones or time intervals.
Historical Analysis: View how congestion has changed over days, weeks, or months.

Time Series Graphs to show traffic density over time.
Bar/Column Charts for comparing congestion levels across multiple zones.
Heatmaps to visualize traffic intensity within zones at specific times.
