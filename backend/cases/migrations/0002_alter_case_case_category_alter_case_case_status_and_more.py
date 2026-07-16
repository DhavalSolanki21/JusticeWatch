
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("cases", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="case",
            name="case_category",
            field=models.CharField(
                choices=[
                    ("Civil", "Civil"),
                    ("Criminal", "Criminal"),
                    ("Appeal", "Appeal"),
                ],
                db_index=True,
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="case",
            name="case_status",
            field=models.CharField(
                choices=[
                    ("Pending", "Pending"),
                    ("Disposed", "Disposed"),
                    ("Stayed", "Stayed"),
                ],
                db_index=True,
                default="Pending",
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="case",
            name="chargesheet_status",
            field=models.CharField(
                choices=[
                    ("Not Filed", "Not Filed"),
                    ("Filed", "Filed"),
                    ("Under Review", "Under Review"),
                    ("Trial", "Trial"),
                ],
                db_index=True,
                default="Not Filed",
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="case",
            name="court_name",
            field=models.CharField(db_index=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="case",
            name="filed_date",
            field=models.DateField(db_index=True),
        ),
    ]
