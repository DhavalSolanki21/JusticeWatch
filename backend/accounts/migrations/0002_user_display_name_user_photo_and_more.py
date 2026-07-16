
import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("districts", "0002_state_district_state"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="display_name",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="photo",
            field=models.ImageField(blank=True, null=True, upload_to="profile_photos/"),
        ),
        migrations.AlterField(
            model_name="user",
            name="district_scope",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_users",
                to="districts.district",
            ),
        ),
    ]
