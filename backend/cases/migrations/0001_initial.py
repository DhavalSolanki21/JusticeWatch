
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("districts", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Case",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("case_number", models.CharField(max_length=100, unique=True)),
                ("court_name", models.CharField(max_length=255)),
                (
                    "case_category",
                    models.CharField(
                        choices=[
                            ("Civil", "Civil"),
                            ("Criminal", "Criminal"),
                            ("Appeal", "Appeal"),
                        ],
                        max_length=50,
                    ),
                ),
                ("crime_type", models.CharField(blank=True, max_length=100, null=True)),
                ("applicable_sections", models.CharField(max_length=255)),
                ("fir_number", models.CharField(blank=True, max_length=100, null=True)),
                ("fir_date", models.DateField(blank=True, null=True)),
                ("arrest_date", models.DateField(blank=True, null=True)),
                (
                    "chargesheet_status",
                    models.CharField(
                        choices=[
                            ("Not Filed", "Not Filed"),
                            ("Filed", "Filed"),
                            ("Under Review", "Under Review"),
                            ("Trial", "Trial"),
                        ],
                        default="Not Filed",
                        max_length=50,
                    ),
                ),
                (
                    "case_status",
                    models.CharField(
                        choices=[
                            ("Pending", "Pending"),
                            ("Disposed", "Disposed"),
                            ("Stayed", "Stayed"),
                        ],
                        default="Pending",
                        max_length=50,
                    ),
                ),
                ("filed_date", models.DateField()),
                ("disposed_date", models.DateField(blank=True, null=True)),
                ("num_parties", models.IntegerField(default=2)),
                ("case_notes", models.TextField(blank=True, null=True)),
                ("difficulty_score", models.FloatField(blank=True, null=True)),
                (
                    "difficulty_tier",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("critical", "Critical"),
                        ],
                        max_length=20,
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "district",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="cases",
                        to="districts.district",
                    ),
                ),
                (
                    "judge",
                    models.ForeignKey(
                        blank=True,
                        limit_choices_to={"role": "judge"},
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="judged_cases",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-filed_date"],
            },
        ),
        migrations.CreateModel(
            name="CaseAssignment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("assigned_date", models.DateField(auto_now_add=True)),
                (
                    "representing",
                    models.CharField(
                        choices=[
                            ("Petitioner", "Petitioner"),
                            ("Respondent", "Respondent"),
                            ("Defense", "Defense"),
                            ("Prosecution", "Prosecution"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "case",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="cases.case"
                    ),
                ),
                (
                    "lawyer",
                    models.ForeignKey(
                        limit_choices_to={"role": "lawyer"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="case_assignments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
