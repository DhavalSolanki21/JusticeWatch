from django.core.management.base import BaseCommand
from districts.services import compute_district_summaries

class Command(BaseCommand):
    help = 'Refreshes district case aggregates and calculates severity tiers.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Computing district summaries...')
        compute_district_summaries()
        self.stdout.write(self.style.SUCCESS('Successfully refreshed district summaries.'))
