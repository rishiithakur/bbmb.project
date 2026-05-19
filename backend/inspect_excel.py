import pandas as pd
import json

file_path = r"D:\BBMC DAM WATER LEVEL MONITORING SYSTEM\Dam_WaterLevel_DB_Design.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    
    # Try to find a sheet that looks like it has sites/stations
    # Usually it's named 'Sites', 'Stations', or the first sheet
    sheet_name = 'Sites' if 'Sites' in xl.sheet_names else xl.sheet_names[0]
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    
    # Clean up column names and convert to list of dicts
    data = df.to_dict(orient='records')
    print(json.dumps(data[:5], indent=2)) # Print first 5 rows to see structure
    
except Exception as e:
    print(f"Error: {e}")
