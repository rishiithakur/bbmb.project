from django.db import models

class SiteMaster(models.Model):
    site_id = models.AutoField(primary_key=True)
    site_code = models.CharField(max_length=20, unique=True)
    station_name = models.CharField(max_length=150)
    station_id_device = models.CharField(max_length=20, unique=True, null=True, blank=True)
    division = models.CharField(max_length=100)
    basin = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, default='Himachal Pradesh')
    latitude = models.DecimalField(max_digits=10, decimal_places=6)
    longitude = models.DecimalField(max_digits=10, decimal_places=6)
    dam_type = models.CharField(max_length=50, null=True, blank=True)
    full_reservoir_level = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    max_water_level = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    dead_storage_level = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    total_capacity_mcm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    live_capacity_mcm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    catchment_area_sqkm = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    instrumentation = models.CharField(max_length=100, null=True, blank=True)
    site_status = models.CharField(max_length=30, default='Active')
    transmission_minutes = models.SmallIntegerField(null=True, blank=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    functional = models.BooleanField(default=True)
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'site_master'
        verbose_name = 'Site Master'
        verbose_name_plural = 'Site Masters'

    def __str__(self):
        return f"{self.station_name} ({self.site_code})"
