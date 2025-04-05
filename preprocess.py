# File: preprocess.py
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq # Although saving as arrow, parquet might be needed implicitly by pandas sometimes
import pyarrow.compute as pc
import re
import sys
import os

# --- Configuration ---
# UPDATED: Paths point outside the repo
INPUT_CSV_PATH = "mta_data.csv"
OUTPUT_ARROW_PATH = "mta_map.arrow"
# Columns expected by the JavaScript expressions/config
NUMERIC_COLUMNS = ["CRZ Entries", "Excluded Roadway Entries"] # Corrected: Roadway
LOCATION_COLUMN = "Detection Group" # Corrected: Detection Group
# --- ADDED ROW LIMIT --- 
# ROW_LIMIT = 100000 # Process only the first N rows for faster dev - REMOVING LIMIT
# ---------------------

# --- ADDED Coordinate Mapping ---
# Ensure this matches the one used in newindex.html initially
locationToCoords = {
    # Keep lines/rectangles as single points for aggregation centroid
    "Brooklyn Bridge": {"lat": 40.7061, "lon": -73.9969},
    "Queens Midtown Tunnel": {"lat": 40.747696, "lon": -73.969075}, # UPDATED
    "Hugh L. Carey Tunnel": {"lat": 40.7040, "lon": -74.0133},
    "Lincoln Tunnel": {"lat": 40.76328, "lon": -74.0108}, # Approx midpoint of provided range
    "Holland Tunnel": {"lat": 40.7276, "lon": -74.0211},
    "Queensboro Bridge": {"lat": 40.7566, "lon": -73.9545}, # Approx midpoint of provided range
    "Williamsburg Bridge": {"lat": 40.7138, "lon": -73.9718},
    "Manhattan Bridge": {"lat": 40.7074, "lon": -73.9909},
    "West Side Highway at 60th St": {"lat": 40.773485, "lon": -73.992953}, # UPDATED
    "West 60th St": {"lat": 40.771044, "lon": -73.987117}, # UPDATED
    "FDR Drive at 60th St": {"lat": 40.759220, "lon": -73.958277}, # UPDATED
    "East 60th St": {"lat": 40.76345, "lon": -73.96915} # Approx midpoint of provided range
}
# -----------------------------

def clean_col_name(name):
    """Cleans column names to be JS/Perspective friendly."""
    name = name.strip()
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    # Optional: handle consecutive underscores if desired
    # name = re.sub(r'_+', '_', name)
    return name

print(f"Starting preprocessing of {INPUT_CSV_PATH}...")

# Check if input file exists
if not os.path.exists(INPUT_CSV_PATH):
    print(f"ERROR: Input CSV file not found at {INPUT_CSV_PATH}")
    sys.exit(1)

try:
    # Read CSV using pandas
    print(f"Reading CSV with pandas...")
    # Consider adding dtype={'some_col': str} if specific columns cause type inference issues
    df = pd.read_csv(INPUT_CSV_PATH)
    print(f"Read {len(df)} rows.")

    # Clean column names
    print("Cleaning column names...")
    df.columns = [clean_col_name(col) for col in df.columns]
    print("Cleaned names:", df.columns.tolist())

    # Ensure expected columns exist after cleaning
    cleaned_numeric_cols = [clean_col_name(col) for col in NUMERIC_COLUMNS]
    cleaned_location_col = clean_col_name(LOCATION_COLUMN)

    missing_cols = []
    for col in cleaned_numeric_cols + [cleaned_location_col]:
        if col not in df.columns:
            missing_cols.append(col)

    if missing_cols:
         print(f"ERROR: Expected columns missing after cleaning: {missing_cols}")
         print("Please check NUMERIC_COLUMNS and LOCATION_COLUMN definitions.")
         sys.exit(1)


    # Convert numeric columns, coercing errors to NaN
    print(f"Converting numeric columns: {cleaned_numeric_cols}...")
    for col in cleaned_numeric_cols:
        # Using pd.to_numeric first to handle potential non-numeric strings gracefully
        df[col] = pd.to_numeric(df[col], errors='coerce')
        # Fill NaN with 0 (or choose another strategy if appropriate)
        df[col] = df[col].fillna(0)
        # Convert to integer type (adjust if floats are needed)
        try:
            df[col] = df[col].astype('int32')
        except ValueError as e:
             print(f"Warning: Could not convert column '{col}' to int32 after fillna(0). Keeping as float. Error: {e}")
             df[col] = df[col].astype('float32')


    # Ensure location column is string
    print(f"Ensuring location column '{cleaned_location_col}' is string...")
    df[cleaned_location_col] = df[cleaned_location_col].astype(str)

    # --- Add Latitude and Longitude using the mapping ---
    print(f"Adding latitude and longitude based on '{cleaned_location_col}'...")

    def get_coord(location, coord_type):
        return locationToCoords.get(location, {}).get(coord_type) # Returns None if location or coord_type not found

    df['latitude'] = df[cleaned_location_col].apply(lambda loc: get_coord(loc, 'lat'))
    df['longitude'] = df[cleaned_location_col].apply(lambda loc: get_coord(loc, 'lon'))

    # Optional: Log how many rows got coordinates
    rows_with_coords = df['latitude'].notna().sum()
    print(f"Mapped coordinates for {rows_with_coords} out of {len(df)} rows.")

    # Optional: Filter out rows without coordinates before saving if desired
    # print("Filtering out rows without coordinates...")
    # df = df.dropna(subset=['latitude', 'longitude'])
    # print(f"Keeping {len(df)} rows with coordinates.")
    # ----------------------------------------------------

    # Convert pandas DataFrame to PyArrow Table
    print("Converting DataFrame to PyArrow Table...")
    table = pa.Table.from_pandas(df, preserve_index=False)

    # Write Arrow table to a compressed file
    print(f"Writing UNCOMPRESSED Arrow file to {OUTPUT_ARROW_PATH}...")
    with pa.output_stream(OUTPUT_ARROW_PATH) as sink:
        with pa.ipc.new_stream(sink, table.schema) as writer:
            writer.write_table(table)

    print("Preprocessing complete!")
    print(f"Output file: {OUTPUT_ARROW_PATH}")

except FileNotFoundError:
    print(f"ERROR: Input file not found at {INPUT_CSV_PATH}")
    sys.exit(1)
except pd.errors.EmptyDataError:
    print(f"ERROR: Input file {INPUT_CSV_PATH} is empty.")
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
