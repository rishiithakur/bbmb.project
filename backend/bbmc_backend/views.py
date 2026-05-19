import time
import logging
from django.db import connections
from django.db.utils import OperationalError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger(__name__)

class HealthCheckView(APIView):
    """
    Production-ready health check endpoint for checking system and DB status.
    Implements robust retry logic for DB verification.
    """
    permission_classes = [] # Publicly accessible for health checks

    def get(self, request):
        db_healthy = False
        db_error = None
        retries = 3
        delay = 1.0

        for attempt in range(1, retries + 1):
            try:
                db_conn = connections['default']
                # Trigger a simple query to verify active connectivity
                db_conn.cursor()
                db_healthy = True
                break
            except OperationalError as e:
                db_error = str(e)
                logger.warning(f"Database connection attempt {attempt} failed: {db_error}")
                if attempt < retries:
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff

        # Validate environment configuration
        env_configured = bool(
            settings.DATABASES['default']['NAME'] and 
            settings.DATABASES['default']['USER'] and 
            settings.DATABASES['default']['PASSWORD']
        )

        response_status = status.HTTP_200_OK if db_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response({
            'status': 'healthy' if db_healthy else 'unhealthy',
            'database': {
                'connected': db_healthy,
                'error': db_error if not db_healthy else None,
                'pooling_active': bool(settings.DATABASES['default'].get('CONN_MAX_AGE', 0))
            },
            'environment': {
                'configured': env_configured,
                'debug_mode': settings.DEBUG
            },
            'timestamp': time.time()
        }, status=response_status)
