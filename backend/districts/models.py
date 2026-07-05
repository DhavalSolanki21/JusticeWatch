from django.db import models

class State(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name

class District(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='districts', null=True, blank=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    population = models.IntegerField(null=True, blank=True)
    total_courts = models.IntegerField(default=1)

    def __str__(self):
        return self.name

class DistrictSummary(models.Model):
    SEVERITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    district = models.OneToOneField(District, on_delete=models.CASCADE)
    pending_count = models.IntegerField(default=0)
    disposed_count = models.IntegerField(default=0)
    disposal_rate = models.FloatField(default=0.0)
    avg_case_age_days = models.FloatField(default=0.0)
    severity_tier = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='low')
    last_computed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Summary: {self.district.name}"
