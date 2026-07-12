import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'justicewatch.settings')
django.setup()

from accounts.models import User

admin_username = os.environ.get('ADMIN_USERNAME')
admin_password = os.environ.get('ADMIN_PASSWORD')

if not admin_username or not admin_password:
    raise ValueError("ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set.")

# Create admin user
if not User.objects.filter(username=admin_username).exists():
    admin = User.objects.create_superuser(admin_username, f'{admin_username}@justicewatch.com', admin_password)
    admin.role = 'judge'
    admin.is_verified = True
    admin.full_name = "Chief Justice Admin"
    admin.save()
    print(f"Superuser '{admin_username}' created")
else:
    print(f"Superuser '{admin_username}' already exists")
