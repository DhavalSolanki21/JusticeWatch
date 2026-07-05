from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'full_name', 'bar_council_id', 'designation')
        
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data['role'],
            full_name=validated_data.get('full_name', ''),
            bar_council_id=validated_data.get('bar_council_id', ''),
            designation=validated_data.get('designation', '')
        )
        user.set_password(validated_data['password'])
        user.is_verified = False  # Explicitly enforce this
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        if not self.user.is_verified and not self.user.is_superuser:
            raise serializers.ValidationError({"detail": "Account is not verified. Please wait for admin approval."})
            
        data.update({
            'user': {
                'id': self.user.id,
                'role': self.user.role,
                'full_name': self.user.full_name,
                'is_verified': self.user.is_verified
            }
        })
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'full_name', 'district_scope', 'is_verified')
