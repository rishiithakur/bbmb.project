from django.db import models
from django.conf import settings
from sites_master.models import SiteMaster

class WaterLevelLog(models.Model):
    TYPE_CHOICES = (
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('estimated', 'Estimated'),
    )
    
    SOURCE_CHOICES = (
        ('mobile', 'Mobile App'),
        ('desktop', 'Web Dashboard'),
        ('api', 'External API'),
    )

    log_id = models.AutoField(primary_key=True)
    site = models.ForeignKey(SiteMaster, on_delete=models.CASCADE, related_name='water_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='water_logs')
    
    # Timing
    observation_date = models.DateField()
    observation_time = models.TimeField(null=True, blank=True)   # optional for DRAFT
    observation_datetime = models.DateTimeField(db_index=True)
    
    # Core Readings — null/blank allowed for DRAFT saves; enforced FINAL at serializer level
    water_level_m = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    # water_level_ft will be a property or calculated field in Django
    storage_mcm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    storage_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    inflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    outflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    net_change_m = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    
    # Context
    observation_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='manual')
    weather_condition = models.CharField(max_length=50, null=True, blank=True)
    visibility = models.CharField(max_length=30, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    
    # Submission Metadata
    entry_source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='mobile')
    entry_latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    entry_longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_logs')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # QC
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(null=True, blank=True)
    
    # System Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'water_level_log'
        unique_together = ('site', 'observation_datetime')
        verbose_name = 'Water Level Log'
        verbose_name_plural = 'Water Level Logs'

    @property
    def water_level_ft(self):
        if self.water_level_m:
            return round(float(self.water_level_m) * 3.28084, 3)
        return None

    def __str__(self):
        return f"{self.site.station_name} - {self.observation_datetime}"

class DamObservation(models.Model):
    obs_id = models.AutoField(primary_key=True)
    log = models.OneToOneField(WaterLevelLog, on_delete=models.CASCADE, related_name='dam_detail')
    site = models.ForeignKey(SiteMaster, on_delete=models.CASCADE, related_name='dam_observations')
    
    # Spillway Section
    spillway_gates_total = models.SmallIntegerField(null=True, blank=True)
    spillway_gates_open = models.SmallIntegerField(null=True, blank=True)
    spillway_opening_m = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    spillway_discharge_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    
    # Sluice Section
    sluice_gates_total = models.SmallIntegerField(null=True, blank=True)
    sluice_gates_open = models.SmallIntegerField(null=True, blank=True)
    sluice_discharge_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    
    # Power House Section
    power_units_running = models.SmallIntegerField(null=True, blank=True)
    power_generation_mw = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    power_discharge_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    
    # Rainfall Section
    rainfall_today_mm = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    rainfall_yesterday_mm = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    rainfall_this_month_mm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    rainfall_this_year_mm = models.DecimalField(max_digits=9, decimal_places=2, null=True, blank=True)
    
    # Levels
    upstream_level_m = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    downstream_level_m = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    tail_water_level_m = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    
    # Environment
    air_temp_celsius = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    water_temp_celsius = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    wind_speed_kmh = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    wind_direction = models.CharField(max_length=10, null=True, blank=True)
    humidity_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Structural
    seepage_lt_per_min = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    piezometer_reading = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    dam_condition = models.CharField(max_length=30, default='Normal')
    alert_level = models.CharField(max_length=20, default='Green')
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dam_observation'
        verbose_name = 'Dam Observation'
        verbose_name_plural = 'Dam Observations'

    def __str__(self):
        return f"Detail for {self.log}"

class ObservationPhoto(models.Model):
    photo_id = models.AutoField(primary_key=True)
    log = models.ForeignKey(WaterLevelLog, on_delete=models.CASCADE, related_name='photos')
    photo = models.ImageField(upload_to='observation_photos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'observation_photos'
        verbose_name = 'Observation Photo'
        verbose_name_plural = 'Observation Photos'

    def __str__(self):
        return f"Photo for {self.log}"

# ---------------------------------------------------------
# UNMANAGED MODELS FOR POSTGRESQL VIEWS
# ---------------------------------------------------------

class VwSiteLatestStatus(models.Model):
    site_id = models.IntegerField(primary_key=True)
    site_code = models.CharField(max_length=255, null=True, blank=True)
    station_name = models.CharField(max_length=255, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    basin = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    dam_type = models.CharField(max_length=255, null=True, blank=True)
    site_status = models.CharField(max_length=255, null=True, blank=True)
    log_id = models.IntegerField(null=True, blank=True)
    observation_datetime = models.DateTimeField(null=True, blank=True)
    water_level_m = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    water_level_ft = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    storage_mcm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    storage_percent = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    inflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    outflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    weather_condition = models.CharField(max_length=255, null=True, blank=True)
    is_verified = models.BooleanField(null=True, blank=True)
    operator_name = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        managed = False
        db_table = 'vw_site_latest_status'

class VwGisPopup(models.Model):
    site_id = models.IntegerField(primary_key=True)
    site_code = models.CharField(max_length=255, null=True, blank=True)
    station_name = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    basin = models.CharField(max_length=255, null=True, blank=True)
    dam_type = models.CharField(max_length=255, null=True, blank=True)
    full_reservoir_level = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    water_level_m = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    storage_percent = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    inflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    outflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    weather_condition = models.CharField(max_length=255, null=True, blank=True)
    observation_datetime = models.DateTimeField(null=True, blank=True)
    spillway_gates_open = models.CharField(max_length=255, null=True, blank=True)
    spillway_discharge_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    power_generation_mw = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    rainfall_today_mm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    alert_level = models.CharField(max_length=255, null=True, blank=True)
    dam_condition = models.CharField(max_length=255, null=True, blank=True)
    operator_name = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        managed = False
        db_table = 'vw_gis_popup'

class VwOperatorSite(models.Model):
    user_id = models.IntegerField(primary_key=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(null=True, blank=True)
    site_id = models.IntegerField(null=True, blank=True)
    site_code = models.CharField(max_length=255, null=True, blank=True)
    station_name = models.CharField(max_length=255, null=True, blank=True)
    division = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        managed = False
        db_table = 'vw_operator_site'

class VwDashboardSummary(models.Model):
    total_sites = models.BigIntegerField(primary_key=True)
    total_operators = models.BigIntegerField(null=True, blank=True)
    total_entries = models.BigIntegerField(null=True, blank=True)
    pending_verifications = models.BigIntegerField(null=True, blank=True)
    red_alert_sites = models.BigIntegerField(null=True, blank=True)
    class Meta:
        managed = False
        db_table = 'vw_dashboard_summary'

class VwFullEntryDetails(models.Model):
    log_id = models.IntegerField(primary_key=True)
    observation_datetime = models.DateTimeField(null=True, blank=True)
    site_id = models.IntegerField(null=True, blank=True)
    station_name = models.CharField(max_length=255, null=True, blank=True)
    site_code = models.CharField(max_length=255, null=True, blank=True)
    user_id = models.IntegerField(null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=255, null=True, blank=True)
    water_level_m = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    storage_mcm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    storage_percent = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    inflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    outflow_cusecs = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    spillway_gates_open = models.CharField(max_length=255, null=True, blank=True)
    power_generation_mw = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    rainfall_today_mm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    alert_level = models.CharField(max_length=255, null=True, blank=True)
    is_verified = models.BooleanField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        managed = False
        db_table = 'vw_full_entry_details'
