from django.core.management.base import BaseCommand
from django.db import transaction
from cases.models import Case, CaseAssignment
from timeline.models import Hearing
from districts.models import DistrictSummary
from districts.services import compute_district_summaries

class Command(BaseCommand):
    help = "Clears all demo data (cases, hearings, assignments, summaries) from the database"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Starting database cleanup..."))

        with transaction.atomic():
            assignments_count = CaseAssignment.objects.count()
            CaseAssignment.objects.all().delete()
            self.stdout.write(f"Deleted {assignments_count} case assignments.")

            hearings_count = Hearing.objects.count()
            Hearing.objects.all().delete()
            self.stdout.write(f"Deleted {hearings_count} hearings.")

            cases_count = Case.objects.count()
            Case.objects.all().delete()
            self.stdout.write(f"Deleted {cases_count} cases.")

            summaries_count = DistrictSummary.objects.count()
            DistrictSummary.objects.all().delete()
            self.stdout.write(f"Deleted {summaries_count} district summaries.")

            self.stdout.write("Resetting district summaries...")
            compute_district_summaries()

        self.stdout.write(self.style.SUCCESS("Demo data cleared successfully!"))
