import os
import json
import uuid
from typing import List, Dict, Optional, Union
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("No OpenAI API key found. Please set the OPENAI_API_KEY environment variable.")

# Configure OpenAI API
client = OpenAI(api_key=OPENAI_API_KEY)

# Available data columns for context
AVAILABLE_COLUMNS = [
    "Toll Date", "Toll Hour", "Toll 10 Minute Block", "Minute of Hour",
    "Hour of Day", "Day of Week Int", "Day of Week", "Toll Week",
    "Time Period", "Vehicle Class", "Detection Group", "Detection Region",
    "CRZ Entries", "Excluded Roadway Entries"
]

# Pydantic models for type validation
class PerspectiveConfig(BaseModel):
    plugin: str = Field(..., description="Chart type: 'Y Bar', 'Y Line', or 'X/Y Scatter'")
    plugin_config: dict = Field(default_factory=dict)
    settings: bool = False
    title: str
    group_by: List[str]
    split_by: List[str] = Field(default_factory=list)
    columns: List[str]
    filter: List = Field(default_factory=list)
    sort: List = Field(default_factory=list)
    expressions: Dict = Field(default_factory=dict)
    aggregates: Dict[str, str]
    master: bool = False
    table: str = "mta"
    linked: bool = False

class PerspectiveLayout(BaseModel):
    sizes: List[float] = [1]
    detail: Dict
    mode: str = "globalFilters"
    viewers: Dict[str, PerspectiveConfig]

def get_chart_recommendation(question):
    prompt = f"""
    Given the following data columns from a traffic analysis dataset:
    {AVAILABLE_COLUMNS}
    
    And this user question: "{question}"
    
    Determine:
    1. The most appropriate chart type (choose only from: "bar", "line", or "scatter")
    2. The relevant columns needed to answer this question
    3. Any necessary aggregations and groupings
    4. A clear title for the chart
    
    Consider:
    - Bar charts are best for comparing categories
    - Line charts are best for showing trends over time
    - Scatter plots are best for showing correlations between two numeric variables
    
    Format your response as a clear explanation of why you chose this chart type and what columns are needed.
    """
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a data visualization expert helping to choose the best chart type and columns for analysis."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

def create_perspective_layout(config: PerspectiveConfig) -> PerspectiveLayout:
    widget_id = f"PERSPECTIVE_GENERATED_ID_{str(uuid.uuid4())[:8]}"
    return PerspectiveLayout(
        detail={
            "main": {
                "type": "tab-area",
                "widgets": [widget_id],
                "currentIndex": 0
            }
        },
        viewers={widget_id: config}
    )

def generate_chart_config(recommendation: str, question: str) -> PerspectiveConfig:
    prompt = f"""
    Based on this chart recommendation and question:
    Question: {question}
    Recommendation: {recommendation}
    
    Generate a JSON configuration that follows this EXACT structure:
    {{
        "plugin": string (must be exactly one of: "Y Bar", "Y Line", "X/Y Scatter"),
        "plugin_config": {{}},
        "settings": false,
        "title": string (clear title based on the question),
        "group_by": [list of column names for grouping],
        "split_by": [list of column names for splitting, can be empty],
        "columns": [list of columns to display],
        "filter": [],
        "sort": [],
        "expressions": {{}},
        "aggregates": {{ "column_name": "aggregation_type" }},
        "master": false,
        "table": "mta",
        "linked": false
    }}

    For this specific question about daily traffic at checkpoints, use:
    - group_by: ["Detection Region", "Toll Date"]
    - columns: ["CRZ Entries"]
    - aggregates: {{"CRZ Entries": "sum"}}

    Return ONLY the JSON structure, no explanation.
    """
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a JSON configuration generator. Return only valid JSON without any explanation or markdown formatting."},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Parse the response into our Pydantic model
    config_dict = json.loads(response.choices[0].message.content)
    return PerspectiveConfig(**config_dict)

@app.route('/api/chart-recommendation', methods=['POST'])
def get_recommendation():
    data = request.json
    question = data.get('question')
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    try:
        # Get chart recommendation
        recommendation = get_chart_recommendation(question)
        
        # Generate and validate configuration using Pydantic
        config = generate_chart_config(recommendation, question)
        
        # Create the complete layout
        layout = create_perspective_layout(config)
        
        # Convert to dict for JSON serialization
        layout_dict = layout.model_dump()
        
        return jsonify({
            'recommendation': recommendation,
            'layout': layout_dict
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001) 