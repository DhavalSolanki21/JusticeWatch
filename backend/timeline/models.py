from django.db import models
from django.conf import settings
from cases.models import Case


class Hearing(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="hearings")
    hearing_date = models.DateField()
    purpose = models.CharField(max_length=255)
    outcome_notes = models.TextField(null=True, blank=True)
    next_hearing_date = models.DateField(null=True, blank=True)
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="logged_hearings",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-hearing_date"]

    def __str__(self):
        return f"Hearing on {self.hearing_date} for Case {self.case.case_number}"
