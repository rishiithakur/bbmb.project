import pandas as pd

file_path = r"D:\BBMC DAM WATER LEVEL MONITORING SYSTEM\Dam_WaterLevel_DB_Design.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    for sheet in xl.sheet_names:
        print(f"\n--- {sheet} ---")
        df = pd.read_excel(file_path, sheet_name=sheet)
        print(df.head(10))
except Exception as e:
    print(f"Error: {e}")
