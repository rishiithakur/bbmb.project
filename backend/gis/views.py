from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from observations.models import VwGisPopup, WaterLevelLog

class SiteGeoJSONView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'operator':
            if user.assigned_site_id:
                sites = VwGisPopup.objects.filter(site_id=user.assigned_site_id)
            else:
                sites = VwGisPopup.objects.none()
        else:
            # Fetch directly from the PostgreSQL view via the unmanaged model
            sites = VwGisPopup.objects.all()
        
        features = []
        
        for site in sites:
            # Query latest log to get up-to-date remarks, submission status, and operator details
            latest_log = WaterLevelLog.objects.filter(site_id=site.site_id).order_by('-observation_datetime').first()
            remarks = latest_log.remarks if latest_log else None
            submission_status = 'FINAL' if (latest_log and latest_log.is_verified) else ('DRAFT' if latest_log else None)
            
            # Use data from latest_log as primary source to avoid view lag, and fall back to site model view properties
            water_level = float(latest_log.water_level_m) if (latest_log and latest_log.water_level_m is not None) else (float(site.water_level_m) if site.water_level_m is not None else None)
            storage_percent = float(latest_log.storage_percent) if (latest_log and latest_log.storage_percent is not None) else (float(site.storage_percent) if site.storage_percent is not None else None)
            inflow = float(latest_log.inflow_cusecs) if (latest_log and latest_log.inflow_cusecs is not None) else (float(site.inflow_cusecs) if site.inflow_cusecs is not None else None)
            outflow = float(latest_log.outflow_cusecs) if (latest_log and latest_log.outflow_cusecs is not None) else (float(site.outflow_cusecs) if site.outflow_cusecs is not None else None)
            weather = latest_log.weather_condition if (latest_log and latest_log.weather_condition) else site.weather_condition
            
            # DamObservation details related to latest log
            dob = latest_log.dam_detail if (latest_log and hasattr(latest_log, 'dam_detail')) else None
            spillway_gates_open = dob.spillway_gates_open if (dob and dob.spillway_gates_open is not None) else site.spillway_gates_open
            spillway_discharge = float(dob.spillway_discharge_cusecs) if (dob and dob.spillway_discharge_cusecs is not None) else (float(site.spillway_discharge_cusecs) if site.spillway_discharge_cusecs is not None else None)
            power_generation = float(dob.power_generation_mw) if (dob and dob.power_generation_mw is not None) else (float(site.power_generation_mw) if site.power_generation_mw is not None else None)
            rainfall = float(dob.rainfall_today_mm) if (dob and dob.rainfall_today_mm is not None) else (float(site.rainfall_today_mm) if site.rainfall_today_mm is not None else None)
            dam_condition = dob.dam_condition if (dob and dob.dam_condition) else (site.dam_condition or 'Normal')
            alert_level = dob.alert_level if (dob and dob.alert_level) else (site.alert_level or 'Green')
            operator_name = latest_log.user.full_name if (latest_log and latest_log.user and getattr(latest_log.user, 'full_name', None)) else site.operator_name

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(site.longitude) if site.longitude else 0.0, float(site.latitude) if site.latitude else 0.0]
                },
                "properties": {
                    "id": site.site_id,
                    "code": site.site_code,
                    "name": site.station_name,
                    "division": site.division,
                    "basin": site.basin,
                    "dam_type": site.dam_type,
                    "frl": float(site.full_reservoir_level) if site.full_reservoir_level is not None else None,
                    "alert_level": alert_level,
                    "water_level": water_level,
                    "storage_percent": storage_percent,
                    "inflow": inflow,
                    "outflow": outflow,
                    "weather": weather,
                    "observation_at": latest_log.observation_datetime.isoformat() if (latest_log and latest_log.observation_datetime) else (site.observation_datetime.isoformat() if site.observation_datetime else None),
                    "spillway_gates_open": spillway_gates_open,
                    "spillway_discharge": spillway_discharge,
                    "power_generation_mw": power_generation,
                    "rainfall_mm": rainfall,
                    "dam_condition": dam_condition,
                    "operator_name": operator_name,
                    "remarks": remarks,
                    "submission_status": submission_status,
                }
            }
            features.append(feature)
            
        return Response({
            "type": "FeatureCollection",
            "features": features
        })
