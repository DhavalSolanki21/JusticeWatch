import re
from django.core.management.base import BaseCommand
from django.db import transaction
from cases.models import Case
from districts.models import District, State, DistrictSummary
from districts.services import compute_district_summaries

class Command(BaseCommand):
    help = "Maps DDL district codes to actual Gujarat district names and clears demo data."

    def handle(self, *args, **options):
        self.stdout.write("Starting DDL district mapping and demo data cleanup...")

        guja_dist_map = {
            11: "Gandhinagar",
            12: "The Dangs",
            13: "Ahmedabad",
            14: "Surat",
            15: "Mehsana",
            16: "Rajkot",
            17: "Amreli",
            18: "Anand",
            19: "Banaskantha",
            20: "Bharuch",
            21: "Bhavnagar",
            22: "Dahod",
            23: "Jamnagar",
            24: "Junagadh",
            25: "Kheda",
            26: "Kutch",
            27: "Panchmahal",
            28: "Patan",
            29: "Sabarkantha",
            30: "Surendranagar",
            31: "Vadodara",
            32: "Navsari",
            33: "Narmada",
            34: "Tapi",
            35: "Valsad",
            36: "Porbandar",
            37: "Gir Somnath",
            38: "Aravalli",
            39: "Morbi",
            40: "Devbhumi Dwarka",
            41: "Chhota Udepur",
            42: "Mahisagar",
            43: "Botad",
        }

        gujarat_state, _ = State.objects.get_or_create(
            name="Gujarat", defaults={"code": "GJ"}
        )

        district_objects = {}
        for code, name in guja_dist_map.items():
            dist_obj, created = District.objects.get_or_create(
                name=name,
                defaults={
                    "state": gujarat_state,
                    "code": f"GJ-{code}",
                    "population": 1000000,
                    "total_courts": 5,
                }
            )
            district_objects[code] = dist_obj

        with transaction.atomic():
            demo_cases = Case.objects.filter(case_number__startswith="DEMO-")
            demo_count = demo_cases.count()
            if demo_count > 0:
                self.stdout.write(f"Deleting {demo_count} demo cases...")
                demo_cases.delete()
                self.stdout.write("Demo cases deleted.")

            real_cases = Case.objects.filter(case_number__startswith="17-")
            total_real = real_cases.count()
            self.stdout.write(f"Found {total_real} real Gujarat cases to map.")

            batch_size = 5000
            cases_to_update = []
            updated_count = 0

            for case in real_cases.iterator(chunk_size=batch_size):
                match = re.match(r"^17-(\d+)-", case.case_number)
                if match:
                    code_val = int(match.group(1))
                    if code_val in district_objects:
                        case.district = district_objects[code_val]
                        cases_to_update.append(case)
                        
                        if len(cases_to_update) >= batch_size:
                            Case.objects.bulk_update(cases_to_update, ["district"])
                            updated_count += len(cases_to_update)
                            self.stdout.write(f"Mapped {updated_count}/{total_real} cases...")
                            cases_to_update = []

            if cases_to_update:
                Case.objects.bulk_update(cases_to_update, ["district"])
                updated_count += len(cases_to_update)
                self.stdout.write(f"Mapped {updated_count}/{total_real} cases.")

            DistrictSummary.objects.filter(district__state=gujarat_state).delete()

            self.stdout.write("Computing district summaries for Gujarat...")
            compute_district_summaries()

        self.stdout.write(self.style.SUCCESS("Successfully completed DDL mapping!"))
