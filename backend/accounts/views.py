from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from .models import User
from .serializers import LoginSerializer, UserSerializer, UserCreateSerializer, PasswordResetSerializer
from .permissions import IsBBMCAdmin
from audit.models import AuditLog, Notification
from rest_framework_simplejwt.tokens import RefreshToken


class LoginView(APIView):
    """
    Login view with role-based redirect hints and audit logging.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.is_active or user.is_deleted:
            return Response({'error': 'Account is inactive or deleted.'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Authentication
        user_authenticated = authenticate(username=username, password=password)
        ip_addr = request.META.get('REMOTE_ADDR')

        if user_authenticated:
            # Success
            user.login_count += 1
            user.save()
            
            # Audit Logging
            AuditLog.objects.create(
                action='LOGIN_SUCCESS',
                user=user,
                ip_address=ip_addr,
                status='success'
            )

            # --- Spawn Real-time Login Notification ---
            # 1. Notify the logging in user
            Notification.objects.create(
                recipient_user=user,
                site_id=user.assigned_site_id,
                type='LOGIN_SUCCESS',
                title='Login Success',
                message=f'Welcome back, {user.full_name or user.username}! You have successfully logged in to the BBMC Dam Telemetry Portal.',
                metadata_json={'ip_address': ip_addr, 'login_count': user.login_count}
            )
            # 2. If it's an operator, also broadcast to administrators
            if user.role == 'operator':
                Notification.objects.create(
                    recipient_role='admin',
                    site_id=user.assigned_site_id,
                    type='OPERATOR_LOGIN',
                    title='Operator Activity: Login',
                    message=f"Operator '{user.username}' ({user.full_name or 'No Name'}) has logged in from IP {ip_addr or 'Unknown'}.",
                    metadata_json={'username': user.username, 'ip_address': ip_addr}
                )
            
            # Generate JWT Tokens
            refresh = RefreshToken.for_user(user_authenticated)
            
            # Role-Based Redirect Hint
            redirect_to = '/dashboard' if user.role == 'admin' else '/entry'
            
            return Response({
                'message': 'Login successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'redirect_to': redirect_to
            }, status=status.HTTP_200_OK)
        else:
            # Failure
            AuditLog.objects.create(
                action='LOGIN_FAILURE',
                ip_address=ip_addr,
                status='failed',
                error_message=f'Failed login attempt for {username}'
            )
            
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """
    Logout view with audit logging.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        username = request.user.username
        ip_addr = request.META.get('REMOTE_ADDR')
        
        # Audit Logging
        AuditLog.objects.create(
            action='LOGOUT',
            user=request.user,
            ip_address=ip_addr,
            status='success'
        )

        # --- Spawn Real-time Logout Notification ---
        # 1. Notify the user
        Notification.objects.create(
            recipient_user=request.user,
            site_id=request.user.assigned_site_id,
            type='LOGOUT',
            title='Session Closed',
            message='You have successfully logged out of your session. All telemetry drafts have been safely synchronized.'
        )
        # 2. If it's an operator, notify admins
        if request.user.role == 'operator':
            Notification.objects.create(
                recipient_role='admin',
                site_id=request.user.assigned_site_id,
                type='OPERATOR_LOGOUT',
                title='Operator Activity: Logout',
                message=f"Operator '{request.user.username}' has logged out.",
                metadata_json={'username': request.user.username}
            )
        
        logout(request)
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsBBMCAdmin]
    
    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(is_deleted=False).order_by('-created_at')
        if user.role == 'admin':
            # Prevent normal admin from seeing supreme_admin or ultra_admin accounts
            qs = qs.exclude(role__in=['supreme_admin', 'ultra_admin'])
        return qs
        
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        # Prevent normal admin from creating supreme_admin or ultra_admin accounts
        role = serializer.validated_data.get('role', 'operator')
        if self.request.user.role == 'admin' and role in ['supreme_admin', 'ultra_admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to create Supreme Admin or Ultra Admin accounts.")
        user = serializer.save()
        ip_addr = self.request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            action='USER_CREATED',
            user=self.request.user,
            table_name='user_master',
            record_id=user.user_id,
            ip_address=ip_addr,
            status='success'
        )

class UserDetailUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsBBMCAdmin]
    lookup_field = 'user_id'

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(is_deleted=False)
        if user.role == 'admin':
            # Prevent normal admin from querying/updating supreme_admin or ultra_admin accounts
            qs = qs.exclude(role__in=['supreme_admin', 'ultra_admin'])
        return qs

    def perform_update(self, serializer):
        # Prevent normal admin from promoting anyone to supreme_admin or ultra_admin roles
        role = serializer.validated_data.get('role')
        if self.request.user.role == 'admin' and role in ['supreme_admin', 'ultra_admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to assign Supreme Admin or Ultra Admin roles.")
        serializer.save()

    def perform_destroy(self, instance):
        """
        Soft delete the user instead of hard deleting from DB.
        """
        instance.is_deleted = True
        instance.is_active = False
        instance.save()
        
        # Log the deletion
        ip_addr = self.request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            action='USER_DELETED',
            user=self.request.user,
            table_name='user_master',
            record_id=instance.user_id,
            ip_address=ip_addr,
            status='success'
        )

class UserPasswordResetView(generics.GenericAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [IsBBMCAdmin]
    lookup_field = 'user_id'

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(is_deleted=False)
        if user.role == 'admin':
            qs = qs.exclude(role__in=['supreme_admin', 'ultra_admin'])
        return qs

    def post(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Audit logging
            ip_addr = self.request.META.get('REMOTE_ADDR')
            AuditLog.objects.create(
                action='USER_PASSWORD_RESET',
                user=self.request.user,
                table_name='user_master',
                record_id=user.user_id,
                ip_address=ip_addr,
                status='success'
            )
            return Response({'message': f'Password for {user.username} reset successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAccountStatusView(generics.GenericAPIView):
    permission_classes = [IsBBMCAdmin]
    lookup_field = 'user_id'

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(is_deleted=False)
        if user.role == 'admin':
            qs = qs.exclude(role__in=['supreme_admin', 'ultra_admin'])
        return qs

    def post(self, request, *args, **kwargs):
        user = self.get_object()
        action_val = request.data.get('action') # 'activate', 'deactivate'
        
        if action_val == 'activate':
            user.is_active = True
            log_action = 'USER_ACTIVATED'
        elif action_val == 'deactivate':
            user.is_active = False
            log_action = 'USER_DEACTIVATED'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.save()
        
        # Audit logging
        ip_addr = self.request.META.get('REMOTE_ADDR')
        AuditLog.objects.create(
            action=log_action,
            user=self.request.user,
            table_name='user_master',
            record_id=user.user_id,
            ip_address=ip_addr,
            status='success'
        )
        return Response({'message': f'User {user.username} is_active updated to {user.is_active}.'})

from django.http import HttpResponse
from .models import SystemBranding

class BrandingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, image_type):
        try:
            branding = SystemBranding.objects.get(key='current')
            if image_type == 'logo':
                if not branding.logo_data:
                    return Response({'error': 'Logo not found in DB'}, status=404)
                return HttpResponse(branding.logo_data, content_type=branding.logo_mimetype)
            elif image_type == 'background':
                if not branding.background_data:
                    return Response({'error': 'Background not found in DB'}, status=404)
                return HttpResponse(branding.background_data, content_type=branding.background_mimetype)
            return Response({'error': 'Invalid image type'}, status=400)
        except SystemBranding.DoesNotExist:
            return Response({'error': 'Branding settings not initialized'}, status=404)
