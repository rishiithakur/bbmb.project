from django.db import models

class SiteMaster(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

    site_id = models.AutoField(primary_key=True)
    site_code = models.CharField(max_length=20, unique=True)
    station_name = models.CharField(max_length=150)
    station_id_device = models.CharField(max_length=20, unique=True, null=True, blank=True)
    basin = models.CharField(max_length=100, blank=True, null=True)
    division = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=100, default='Himachal Pradesh')
    river_tributary = models.CharField(max_length=255, blank=True, null=True)
    
    # Technical Parameters
    latitude = models.DecimalField(max_digits=10, decimal_places=6)
    longitude = models.DecimalField(max_digits=10, decimal_places=6)
    
    full_reservoir_level = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True)
    max_water_level = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True)
    dead_storage_level = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True)
    danger_level = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True)
    warning_level = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True)
    minimum_draw_down_level = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True)
    
    total_capacity_mcm = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True)
    live_capacity_mcm = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True)
    catchment_area_sqkm = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True)
    
    # Instrumentation and status
    dam_type = models.CharField(max_length=50, blank=True, null=True)
    site_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Active')
    functional = models.BooleanField(default=True)
    instrumentation = models.TextField(blank=True, null=True)
    transmission_minutes = models.SmallIntegerField(blank=True, null=True)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    
    # Admin
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'sites_master'
        verbose_name = 'Site Master'
        verbose_name_plural = 'Site Masters'

    def __str__(self):
        return f"{self.station_name} ({self.site_code})"
