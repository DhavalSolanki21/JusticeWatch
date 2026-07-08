from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('judge', 'Judge'),
        ('lawyer', 'Lawyer'),
        ('admin', 'Admin'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='lawyer')
    full_name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255, blank=True)
    photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    district_scope = models.ForeignKey('districts.District', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_users')
    bar_council_id = models.CharField(max_length=50, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.full_name or self.username
