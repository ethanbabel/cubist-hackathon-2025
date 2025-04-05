# File: preprocess.py
import pandas as pd
# import geopandas as gpd # No longer needed
# from shapely.geometry import Point # No longer needed
import pyarrow as pa # Restore pyarrow
import sys
import os
import re
# from datetime import datetime # No longer needed

# --- Configuration ---
INPUT_CSV_PATH = "mta_data.csv"
OUTPUT_ARROW_PATH = "mta_map.arrow" # Restore Arrow output path
# OUTPUT_GEOJSON_PATH = "../cubist-hackathon-data/mta_congestion.geojson"

# Columns needed from CSV
TIME_COLUMN_ORIGINAL = "Toll 10 Minute Block"
ENTRIES_COLUMN_ORIGINAL = "CRZ Entries"
EXCLUDED_COLUMN_ORIGINAL = "Excluded Roadway Entries" # Restore Excluded column
LOCATION_COLUMN_ORIGINAL = "Detection Group"

# Coordinate Mapping (Keep as is)
locationToCoords = {
    "Brooklyn Bridge": {"lat": 40.7061, "lon": -73.9969},
    "Queens Midtown Tunnel": {"lat": 40.747696, "lon": -73.969075},
    "Hugh L. Carey Tunnel": {"lat": 40.7040, "lon": -74.0133},
    "Lincoln Tunnel": {"lat": 40.76328, "lon": -74.0108},
    "Holland Tunnel": {"lat": 40.727548, "lon": -74.021338},
    "Queensboro Bridge": {"lat": 40.7566, "lon": -73.9545},
    "Williamsburg Bridge": {"lat": 40.7138, "lon": -73.9718},
    "Manhattan Bridge": {"lat": 40.7074, "lon": -73.9909},
    "West Side Highway at 60th St": {"lat": 40.773485, "lon": -73.992953},
    "West 60th St": {"lat": 40.771044, "lon": -73.987117},
    "FDR Drive at 60th St": {"lat": 40.759220, "lon": -73.958277},
    "East 60th St": {"lat": 40.76345, "lon": -73.96915}
}

def clean_col_name(name):
    """Cleans column names to be JS/Perspective friendly."""
    name = name.strip()
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    return name

print(f"Starting preprocessing of {INPUT_CSV_PATH}...")

if not os.path.exists(INPUT_CSV_PATH):
    print(f"ERROR: Input CSV file not found at {INPUT_CSV_PATH}")
    sys.exit(1)

try:
    # Read CSV
    print(f"Reading CSV with pandas...")
    df = pd.read_csv(INPUT_CSV_PATH)
    print(f"Read {len(df)} rows.")

    # Clean column names
    print("Cleaning column names...")
    original_cols = df.columns.tolist()
    df.columns = [clean_col_name(col) for col in original_cols]
    # Create mapping for easier reference
    col_mapping = {clean_col_name(orig): orig for orig in original_cols}
    # Get cleaned names for required columns
    time_col = clean_col_name(TIME_COLUMN_ORIGINAL)
    entries_col = clean_col_name(ENTRIES_COLUMN_ORIGINAL)
    excluded_col = clean_col_name(EXCLUDED_COLUMN_ORIGINAL) # Restore excluded
    location_col = clean_col_name(LOCATION_COLUMN_ORIGINAL)
    print(f"Required columns (cleaned): {time_col}, {entries_col}, {excluded_col}, {location_col}")

    # --- ADD DateOnly Column Creation ---
    date_col_original = "Toll Date" # Assuming this column exists in the raw CSV
    date_col_cleaned = clean_col_name(date_col_original)
    print(f"Processing date column '{date_col_cleaned}' to create 'DateOnly'...")
    if date_col_cleaned in df.columns:
        # Parse the date column (e.g., 'MM/DD/YYYY') into datetime objects
        # Using 'coerce' will turn unparseable dates into NaT (Not a Time)
        df['parsed_date'] = pd.to_datetime(df[date_col_cleaned], errors='coerce', format='%m/%d/%Y') 
        
        # Handle potential parsing errors (optional but recommended)
        if df['parsed_date'].isnull().any():
            print(f"Warning: {df['parsed_date'].isnull().sum()} rows had unparseable dates in '{date_col_cleaned}'.")
            # Optionally drop rows with bad dates: df.dropna(subset=['parsed_date'], inplace=True)

        # Format the date as YYYY-MM-DD string into the new 'DateOnly' column
        df['DateOnly'] = df['parsed_date'].dt.strftime('%Y-%m-%d')
        # Drop the intermediate parsed_date column if no longer needed
        df.drop(columns=['parsed_date'], inplace=True) 
        print("Created 'DateOnly' column successfully.")
    else:
        print(f"ERROR: Cleaned date column '{date_col_cleaned}' (from '{date_col_original}') not found in DataFrame!")
        # Decide how to proceed: exit, or maybe try parsing time_col? For now, just warn.
        print("Cannot create 'DateOnly' column.")
        # sys.exit(1) # Uncomment to make this fatal
    # --- END DateOnly Column Creation ---

    # --- Time Processing ---
    # Keep time column as string, Perspective can handle it
    print(f"Ensuring time column '{time_col}' is string...")
    df[time_col] = df[time_col].astype(str)

    # --- Coordinate Mapping ---
    print(f"Mapping coordinates based on '{location_col}'...")
    def get_coord(location, coord_type):
        return locationToCoords.get(location, {}).get(coord_type)
    df['latitude'] = df[location_col].apply(lambda loc: get_coord(loc, 'lat'))
    df['longitude'] = df[location_col].apply(lambda loc: get_coord(loc, 'lon'))
    rows_before_coord_filter = len(df)
    # Keep rows even if coords are missing for now, Perspective filter handles it
    # df.dropna(subset=['latitude', 'longitude'], inplace=True)
    # if len(df) < rows_before_coord_filter:
    #    print(f"Warning: Dropped {rows_before_coord_filter - len(df)} rows due to missing coordinates.")
    print(f"Mapped coordinates for {df['latitude'].notna().sum()} rows.")

    # --- Numeric Columns Processing ---
    numeric_cols_cleaned = [entries_col, excluded_col]
    print(f"Processing numeric columns {numeric_cols_cleaned}...")
    for col in numeric_cols_cleaned:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
        
    # --- Location Column ---
    print(f"Ensuring location column '{location_col}' is string...")
    df[location_col] = df[location_col].astype(str)

    # --- REMOVE SINGLE DAY FILTER ---
    # --- REMOVE GeoDataFrame Creation ---

    # --- Convert DataFrame to PyArrow Table ---
    print("Converting DataFrame to PyArrow Table...")
    # Ensure correct types for Arrow if necessary (often inferred well)
    try:
        table = pa.Table.from_pandas(df, preserve_index=False)
    except Exception as e:
        print(f"Error during initial Arrow conversion: {e}. Trying schema specification...")
        # If direct conversion fails, specify schema (example)
        schema = pa.schema([
            (col, pa.string()) if df[col].dtype == 'object' else 
            (col, pa.int32()) if pd.api.types.is_integer_dtype(df[col].dtype) else 
            (col, pa.float64()) if pd.api.types.is_float_dtype(df[col].dtype) else 
            (col, pa.string()) # Default fallback
            for col in df.columns
        ])
        print("Schema specified:", schema)
        table = pa.Table.from_pandas(df, schema=schema, preserve_index=False)
    print("Conversion to Arrow Table successful.")

    # --- Write Arrow File ---
    print(f"Writing Arrow file to {OUTPUT_ARROW_PATH}...")
    if os.path.exists(OUTPUT_ARROW_PATH):
        print(f"Warning: Overwriting existing file at {OUTPUT_ARROW_PATH}")
    # Use pyarrow writer directly
    with pa.OSFile(OUTPUT_ARROW_PATH, 'wb') as sink:
        with pa.ipc.new_stream(sink, table.schema) as writer:
            writer.write_table(table)

    print("Preprocessing complete!")
    print(f"Output file: {OUTPUT_ARROW_PATH}")

# REMOVE ImportError for geopandas
except FileNotFoundError:
    print(f"ERROR: Input file not found at {INPUT_CSV_PATH}")
    sys.exit(1)
except pd.errors.EmptyDataError:
    print(f"ERROR: Input file {INPUT_CSV_PATH} is empty.")
    sys.exit(1)
except KeyError as e:
    print(f"ERROR: A required column name was not found after cleaning: {e}")
    print("Please check the column name definitions (TIME_COLUMN_ORIGINAL, etc.) and the input CSV.")
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
