# cubist-hackathon-2025

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
### Interactive Data Visualizations:
Leverage Perspective, a powerful data visualization library, to explore the data interactively. This includes dynamic tables, graphs, charts, and dashboards that can be customized and filtered based on user input.
### Zone Density Map:
Visualize traffic density across different MTA zones at various times. This provides an overview of traffic patterns and congestion in real-time.
### Real-time Traffic Analysis:
View real-time traffic trends and congestion levels across different MTA zones with interactive graphs.

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
