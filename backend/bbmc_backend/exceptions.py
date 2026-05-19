from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import InternalError, DatabaseError

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If it's a database error (like a trigger exception)
    if response is None:
        if isinstance(exc, (InternalError, DatabaseError)):
            error_msg = str(exc)
            if 'locked' in error_msg.lower():
                return Response(
                    {'error': 'This record is finalized and locked. Editing is prohibited.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return Response(
                {'error': 'A database error occurred.', 'detail': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

    return response
