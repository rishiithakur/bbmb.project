import requests
import json

def test_api():
    print("Getting token...")
    url = "http://localhost:8000/api/v1/auth/token/"
    resp = requests.post(url, data={"username": "admin", "password": "admin123"})
    
    if resp.status_code != 200:
        print(f"Failed to get token: {resp.status_code} {resp.text}")
        return
        
    token = resp.json().get("access")
    
    print("Fetching GeoJSON...")
    gis_url = "http://localhost:8000/api/v1/gis/sites/"
    headers = {"Authorization": f"Bearer {token}"}
    gis_resp = requests.get(gis_url, headers=headers)
    
    if gis_resp.status_code == 200:
        print("GeoJSON data:")
        print(json.dumps(gis_resp.json(), indent=2))
    else:
        print(f"Failed to get GeoJSON: {gis_resp.status_code}")
        with open("error.html", "w", encoding="utf-8") as f:
            f.write(gis_resp.text)
        print("Wrote error to error.html")

if __name__ == '__main__':
    test_api()
