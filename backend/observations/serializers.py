from rest_framework import serializers
from .models import WaterLevelLog, DamObservation, ObservationPhoto
from django.utils import timezone
from django.db import transaction
import math


def _clean_decimal(value):
    """Return None for NaN/Inf floats (HTML number inputs send these as empty → 0 → NaN)."""
    if value is None:
        return None
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return value
    except (TypeError, ValueError):
        return None


class ObservationPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservationPhoto
        fields = ['photo_id', 'photo', 'uploaded_at']


class DamObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DamObservation
        exclude = []  # all fields


# ── Submission status field values ─────────────────────────────────────────────
SUBMISSION_STATUS_DRAFT = 'DRAFT'
SUBMISSION_STATUS_FINAL = 'FINAL'
SUBMISSION_STATUSES = [SUBMISSION_STATUS_DRAFT, SUBMISSION_STATUS_FINAL]

# Fields that live on DamObservation (passed flattened in payload)
DAM_FIELDS = [
    'spillway_gates_open', 'spillway_opening_m', 'spillway_discharge_cusecs',
    'sluice_gates_open', 'sluice_discharge_cusecs', 'power_units_running',
    'power_generation_mw', 'power_discharge_cusecs', 'rainfall_today_mm',
    'upstream_level_m', 'downstream_level_m', 'tail_water_level_m',
    'air_temp_celsius', 'humidity_percent', 'seepage_lt_per_min',
    'piezometer_reading', 'dam_condition', 'alert_level', 'notes',
]


class WaterLevelLogSerializer(serializers.ModelSerializer):
    # ── Read-only enrichments ──────────────────────────────────────────────────
    details = DamObservationSerializer(source='dam_detail', read_only=True)
    photos = ObservationPhotoSerializer(many=True, read_only=True)
    site_name = serializers.ReadOnlyField(source='site.station_name')
    observer_name = serializers.ReadOnlyField(source='user.full_name')
    observation_id = serializers.IntegerField(source='log_id', read_only=True)
    water_level_ft = serializers.FloatField(read_only=True)

    # ── Write aliases (frontend sends these) ──────────────────────────────────
    # Allow frontend to send either `water_level_m` OR `current_water_level`
    current_water_level = serializers.DecimalField(
        source='water_level_m',
        max_digits=8, decimal_places=3,
        required=False, allow_null=True
    )

    # Submission status: controls is_verified
    status = serializers.ChoiceField(
        choices=SUBMISSION_STATUSES,
        write_only=True,
        required=False,
        default=SUBMISSION_STATUS_DRAFT
    )

    # Photo upload (multipart, optional)
    uploaded_photos = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = WaterLevelLog
        fields = [
            # IDs
            'log_id', 'observation_id',
            # Site & user
            'site', 'site_name', 'user', 'observer_name',
            # Timing
            'observation_date', 'observation_time', 'observation_datetime',
            # Core readings — both the real field and the alias
            'water_level_m', 'current_water_level', 'water_level_ft',
            'storage_mcm', 'inflow_cusecs', 'outflow_cusecs', 'net_change_m',
            # Context
            'weather_condition', 'remarks',
            # Verification
            'is_verified', 'is_flagged',
            # Control fields (write-only)
            'status', 'uploaded_photos',
            # Related
            'details', 'photos',
            # Meta
            'created_at', 'updated_at',
        ]
        read_only_fields = ['log_id', 'created_at', 'updated_at', 'user', 'observation_datetime']
        extra_kwargs = {
            # water_level_m is optional at DB level for DRAFT saves.
            # We enforce it only for FINAL via validate().
            'water_level_m': {'required': False, 'allow_null': True},
            'observation_time': {'required': False, 'allow_null': True},
        }

    # ── Custom representation ─────────────────────────────────────────────────
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['status'] = SUBMISSION_STATUS_FINAL if instance.is_verified else SUBMISSION_STATUS_DRAFT
        return ret

    # ── Cross-field validation ────────────────────────────────────────────────
    def validate(self, data):
        # 1. Resolve status and validate water level for final submission
        status_val = data.get('status')
        if status_val is None and self.instance:
            status_val = SUBMISSION_STATUS_FINAL if self.instance.is_verified else SUBMISSION_STATUS_DRAFT
        if status_val is None:
            status_val = SUBMISSION_STATUS_DRAFT

        water_level = data.get('water_level_m')
        if water_level is None and self.instance:
            water_level = self.instance.water_level_m

        if status_val == SUBMISSION_STATUS_FINAL and (water_level is None or water_level == ''):
            raise serializers.ValidationError({
                'water_level_m': (
                    'Water level (m) is required for Final Submission. '
                    'Save as Draft first if this value is not yet available.'
                )
            })

        # 2. Combine date + time → observation_datetime
        obs_date = data.get('observation_date')
        if obs_date is None and self.instance:
            obs_date = self.instance.observation_date

        obs_time = data.get('observation_time')
        if obs_time is None and self.instance:
            obs_time = self.instance.observation_time

        if not obs_time and not (self.instance and self.instance.observation_time):
            from datetime import time
            obs_time = time(0, 0)
            data['observation_time'] = obs_time

        if obs_date and obs_time:
            from datetime import datetime
            dt = datetime.combine(obs_date, obs_time)
            data['observation_datetime'] = (
                timezone.make_aware(dt) if timezone.is_naive(dt) else dt
            )

        return data

    # ── Create ────────────────────────────────────────────────────────────────
    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')
        status_val = validated_data.pop('status', SUBMISSION_STATUS_DRAFT)
        photos_data = validated_data.pop('uploaded_photos', [])

        if status_val == SUBMISSION_STATUS_FINAL:
            validated_data['is_verified'] = True
            validated_data['verified_at'] = timezone.now()
        else:
            validated_data['is_verified'] = False

        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user

        log = WaterLevelLog.objects.create(**validated_data)

        # Pull flattened DamObservation fields from raw request data
        dam_data = self._extract_dam_data(request)
        DamObservation.objects.create(log=log, site=log.site, **dam_data)

        for photo_data in photos_data:
            ObservationPhoto.objects.create(log=log, photo=photo_data)

        return log

    # ── Update ────────────────────────────────────────────────────────────────
    @transaction.atomic
    def update(self, instance, validated_data):
        # Guard: cannot re-edit a finalized record
        if instance.is_verified:
            raise serializers.ValidationError(
                'This record is finalized and cannot be edited. Contact an administrator.'
            )

        request = self.context.get('request')
        status_val = validated_data.pop('status', None)
        photos_data = validated_data.pop('uploaded_photos', [])

        if status_val == SUBMISSION_STATUS_FINAL:
            validated_data['is_verified'] = True
            validated_data['verified_at'] = timezone.now()

        instance = super().update(instance, validated_data)

        dam_data = self._extract_dam_data(request)
        if dam_data:
            DamObservation.objects.update_or_create(
                log=instance, defaults={**{'site': instance.site}, **dam_data}
            )

        for photo_data in photos_data:
            ObservationPhoto.objects.create(log=instance, photo=photo_data)

        return instance

    # ── Helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _extract_dam_data(request) -> dict:
        """Pull DamObservation fields from raw request data, cleaning NaN floats."""
        if not request:
            return {}
        raw = request.data
        result = {}
        for field in DAM_FIELDS:
            if field in raw:
                val = raw.get(field)
                # Skip empty strings and None
                if val is None or val == '' or val == 'null':
                    continue
                result[field] = val
        return result
