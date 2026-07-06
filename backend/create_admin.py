import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'justicewatch.settings')
django.setup()

from accounts.models import User

# Create admin user
if not User.objects.filter(username='admin').exists():
    admin = User.objects.create_superuser('admin', 'admin@justicewatch.com', 'admin')
    admin.role = 'judge'
    admin.is_verified = True
    admin.full_name = "Chief Justice Admin"
    admin.save()
    print("Superuser 'admin' created with password 'admin'")
else:
    print("Superuser 'admin' already exists")
