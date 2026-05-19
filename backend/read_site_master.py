import pandas as pd

file_path = r"D:\BBMC DAM WATER LEVEL MONITORING SYSTEM\Dam_WaterLevel_DB_Design.xlsx"
try:
    df = pd.read_excel(file_path, sheet_name='1. site_master')
    # The real data starts after the header rows. Let's find where.
    # Looking at previous output, it seems to have some intro text.
    print("Full content of '1. site_master' sheet:")
    print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
