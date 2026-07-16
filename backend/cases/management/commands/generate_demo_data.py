import random
import datetime
from django.core.management.base import BaseCommand
from cases.models import Case
from districts.models import District, State
from django.utils import timezone

class Command(BaseCommand):
    help = "Generates dummy data for Gujarat districts to visualize on the map."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Generating demo data..."))

        gujarat, _ = State.objects.get_or_create(name="Gujarat", code="GJ")

        gujarat_districts = [
            "Ahmedabad",
            "Amreli",
            "Anand",
            "Aravalli",
            "Banaskantha",
            "Bharuch",
            "Bhavnagar",
            "Botad",
            "Chhota Udepur",
            "Dahod",
            "The Dangs",
            "Devbhumi Dwarka",
            "Gandhinagar",
            "Gir Somnath",
            "Jamnagar",
            "Junagadh",
            "Kheda",
            "Kutch",
            "Mahisagar",
            "Mehsana",
            "Morbi",
            "Narmada",
            "Navsari",
            "Panchmahal",
            "Patan",
            "Porbandar",
            "Rajkot",
            "Sabarkantha",
            "Surat",
            "Surendranagar",
            "Tapi",
            "Vadodara",
            "Valsad",
        ]

        districts = []
        for d_name in gujarat_districts:
            d_code = d_name.replace(" ", "").upper()[:4]
            district, _ = District.objects.get_or_create(
                state=gujarat, name=d_name, code=d_code
            )
            districts.append(district)

        Case.objects.all().delete()

        crime_types = [
            "Theft",
            "Fraud",
            "Assault",
            "Property Dispute",
            "Divorce",
            "Murder",
            "Corruption",
            "Cybercrime",
        ]
        case_categories = ["Civil", "Criminal", "Appeal"]

        cases_to_create = []
        case_id_counter = 1

        for district in districts:
            if district.name in ["Ahmedabad", "Surat", "Rajkot", "Vadodara"]:
                volume = random.randint(11000, 18000)  # Critical
            elif district.name in [
                "Bhavnagar",
                "Jamnagar",
                "Junagadh",
                "Mehsana",
                "Banaskantha",
            ]:
                volume = random.randint(5000, 9000)  # High
            elif district.name in [
                "Amreli",
                "Anand",
                "Bharuch",
                "Kutch",
                "Patan",
                "Navsari",
                "Kheda",
            ]:
                volume = random.randint(2000, 3900)  # Medium
            else:
                volume = random.randint(100, 1500)  # Low

            if district.name in ["Ahmedabad", "Surat", "Rajkot", "Vadodara"]:
                num_cases = random.randint(800, 1200)  # critical scale for demo
            elif district.name in [
                "Bhavnagar",
                "Jamnagar",
                "Junagadh",
                "Mehsana",
                "Banaskantha",
            ]:
                num_cases = random.randint(400, 600)  # high scale for demo
            elif district.name in [
                "Amreli",
                "Anand",
                "Bharuch",
                "Kutch",
                "Patan",
                "Navsari",
                "Kheda",
            ]:
                num_cases = random.randint(200, 350)  # medium scale for demo
            else:
                num_cases = random.randint(50, 150)  # low scale for demo

            target_volume = volume

            print(f"Generating {target_volume} cases for {district.name}...")

            for _ in range(target_volume):
                is_disposed = random.random() < 0.4  # 40% disposal rate roughly
                filed_days_ago = random.randint(10, 1800)
                filed_date = timezone.now().date() - datetime.timedelta(
                    days=filed_days_ago
                )

                disposed_date = None
                case_status = "Pending"
                if is_disposed:
                    case_status = "Disposed"
                    disposed_days_ago = (
                        random.randint(1, filed_days_ago - 1)
                        if filed_days_ago > 1
                        else 0
                    )
                    disposed_date = timezone.now().date() - datetime.timedelta(
                        days=disposed_days_ago
                    )

                cases_to_create.append(
                    Case(
                        case_number=f"DEMO-{d_code}-{case_id_counter}",
                        district=district,
                        court_name=f"District Court {district.name}",
                        case_category=random.choice(case_categories),
                        crime_type=random.choice(crime_types),
                        applicable_sections="Sec 420, 302",
                        filed_date=filed_date,
                        disposed_date=disposed_date,
                        case_status=case_status,
                        chargesheet_status=random.choice(
                            ["Filed", "Not Filed", "Trial"]
                        ),
                        difficulty_score=random.uniform(0.1, 0.9),
                        difficulty_tier=random.choice(
                            ["low", "medium", "high", "critical"]
                        ),
                    )
                )
                case_id_counter += 1

        batch_size = 10000
        self.stdout.write(f"Committing {len(cases_to_create)} cases to DB...")
        Case.objects.bulk_create(cases_to_create, batch_size=batch_size)

        self.stdout.write(
            self.style.SUCCESS(f"Successfully generated {len(cases_to_create)} cases.")
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Run `python manage.py compute_summaries` to update the map!"
            )
        )
