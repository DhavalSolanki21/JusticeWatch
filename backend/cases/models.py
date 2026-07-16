from django.db import models
from django.conf import settings

class Case(models.Model):
    CATEGORY_CHOICES = (
        ("Civil", "Civil"),
        ("Criminal", "Criminal"),
        ("Appeal", "Appeal"),
    )

    CHARGESHEET_CHOICES = (
        ("Not Filed", "Not Filed"),
        ("Filed", "Filed"),
        ("Under Review", "Under Review"),
        ("Trial", "Trial"),
    )

    STATUS_CHOICES = (
        ("Pending", "Pending"),
        ("Disposed", "Disposed"),
        ("Stayed", "Stayed"),
    )

    TIER_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    )

    case_number = models.CharField(max_length=100, unique=True)
    district = models.ForeignKey(
        "districts.District", on_delete=models.PROTECT, related_name="cases"
    )
    court_name = models.CharField(max_length=255, db_index=True)
    judge = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        limit_choices_to={"role": "judge"},
        related_name="judged_cases",
    )
    case_category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES, db_index=True
    )
    crime_type = models.CharField(max_length=100, null=True, blank=True)
    applicable_sections = models.CharField(max_length=255)
    fir_number = models.CharField(max_length=100, null=True, blank=True)
    fir_date = models.DateField(null=True, blank=True)
    arrest_date = models.DateField(null=True, blank=True)
    chargesheet_status = models.CharField(
        max_length=50, choices=CHARGESHEET_CHOICES, default="Not Filed", db_index=True
    )
    case_status = models.CharField(
        max_length=50, choices=STATUS_CHOICES, default="Pending", db_index=True
    )
    filed_date = models.DateField(db_index=True)
    disposed_date = models.DateField(null=True, blank=True)
    num_parties = models.IntegerField(default=2)
    case_notes = models.TextField(null=True, blank=True)

    difficulty_score = models.FloatField(null=True, blank=True)
    difficulty_tier = models.CharField(
        max_length=20, choices=TIER_CHOICES, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-filed_date"]

    def __str__(self):
        return self.case_number

class CaseAssignment(models.Model):
    REPRESENTING_CHOICES = (
        ("Petitioner", "Petitioner"),
        ("Respondent", "Respondent"),
        ("Defense", "Defense"),
        ("Prosecution", "Prosecution"),
    )

    case = models.ForeignKey(Case, on_delete=models.CASCADE)
    lawyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "lawyer"},
        related_name="case_assignments",
    )
    assigned_date = models.DateField(auto_now_add=True)
    representing = models.CharField(max_length=50, choices=REPRESENTING_CHOICES)

    def __str__(self):
        return f"{self.lawyer} -> {self.case}"
