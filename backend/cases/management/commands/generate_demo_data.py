import random
import datetime
from django.core.management.base import BaseCommand
from cases.models import Case
from districts.models import District, State
from django.utils import timezone

class Command(BaseCommand):
    help = 'Generates dummy data for Gujarat districts to visualize on the map.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Generating demo data...'))

        # Check if Gujarat state exists
        gujarat, _ = State.objects.get_or_create(name='Gujarat', code='GJ')

        # 33 Districts of Gujarat
        gujarat_districts = [
            "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
            "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "The Dangs",
            "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh",
            "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari",
            "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat",
            "Surendranagar", "Tapi", "Vadodara", "Valsad"
        ]

        districts = []
        for d_name in gujarat_districts:
            d_code = d_name.replace(" ", "").upper()[:4]
            district, _ = District.objects.get_or_create(state=gujarat, name=d_name, code=d_code)
            districts.append(district)

        # Clear existing cases to avoid bloated db in demo mode
        Case.objects.all().delete()
        
        crime_types = ["Theft", "Fraud", "Assault", "Property Dispute", "Divorce", "Murder", "Corruption", "Cybercrime"]
        case_categories = ["Civil", "Criminal", "Appeal"]
        
        # Generate varied number of cases for each district
        cases_to_create = []
        case_id_counter = 1
        
        for district in districts:
            # Let's assign random volumes to create interesting map colors
            # E.g. Ahmedabad, Surat get huge numbers. The Dangs gets small numbers.
            if district.name in ["Ahmedabad", "Surat", "Rajkot", "Vadodara"]:
                volume = random.randint(11000, 18000) # Critical
            elif district.name in ["Bhavnagar", "Jamnagar", "Junagadh", "Mehsana", "Banaskantha"]:
                volume = random.randint(5000, 9000) # High
            elif district.name in ["Amreli", "Anand", "Bharuch", "Kutch", "Patan", "Navsari", "Kheda"]:
                volume = random.randint(2000, 3900) # Medium
            else:
                volume = random.randint(100, 1500) # Low

            # Since inserting thousands of rows takes time in sqlite, we will insert just 
            # 1 row per 100 volume but we will let the summary compute script see the raw count.
            # Wait, no, we need to either insert all rows, or we just insert a reasonable 
            # sample (e.g. 50-200 rows per district) so that the summary computation looks okay,
            # or maybe generate exactly the amount?
            # 15000 rows might take 10 seconds to insert if we use bulk_create. Let's use bulk_create for speed.
            
            # Since total could be ~ 100,000 cases, bulk_create in chunks of 5000.
            
            # To keep demo fast, we'll insert a representative 100-300 cases per district,
            # but we want the map to show HUGE numbers!
            # Our `compute_summaries` script just counts Case.objects.filter(district).count()
            # If we want the frontend map to show 15k, we MUST have 15k rows in the DB.
            # Let's cap the maximum to 1000, 500, 300, 100 respectively for fast DB insertion!
            
            if district.name in ["Ahmedabad", "Surat", "Rajkot", "Vadodara"]:
                num_cases = random.randint(800, 1200) # critical scale for demo
            elif district.name in ["Bhavnagar", "Jamnagar", "Junagadh", "Mehsana", "Banaskantha"]:
                num_cases = random.randint(400, 600) # high scale for demo
            elif district.name in ["Amreli", "Anand", "Bharuch", "Kutch", "Patan", "Navsari", "Kheda"]:
                num_cases = random.randint(200, 350) # medium scale for demo
            else:
                num_cases = random.randint(50, 150) # low scale for demo

            # For the demo, we'll map these smaller numbers to high numbers via a multiplier 
            # during compute_summaries later? No, let's just insert them. The map says "Critical (>10K)" 
            # so we'll actually insert 12,000 rows for Ahmedabad. 
            # Let's use bulk_create! 
            
            target_volume = volume
            
            # Let's generate a smaller set, but update compute_summaries? No, just insert volume.
            # Actually inserting 100k rows in sqlite takes about 3 seconds with bulk_create. Let's do it!
            
            print(f"Generating {target_volume} cases for {district.name}...")
            
            for _ in range(target_volume):
                is_disposed = random.random() < 0.4 # 40% disposal rate roughly
                filed_days_ago = random.randint(10, 1800)
                filed_date = timezone.now().date() - datetime.timedelta(days=filed_days_ago)
                
                disposed_date = None
                case_status = 'Pending'
                if is_disposed:
                    case_status = 'Disposed'
                    disposed_days_ago = random.randint(1, filed_days_ago - 1) if filed_days_ago > 1 else 0
                    disposed_date = timezone.now().date() - datetime.timedelta(days=disposed_days_ago)

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
                        chargesheet_status=random.choice(["Filed", "Not Filed", "Trial"]),
                        difficulty_score=random.uniform(0.1, 0.9),
                        difficulty_tier=random.choice(["low", "medium", "high", "critical"])
                    )
                )
                case_id_counter += 1

        # Bulk create in chunks of 10000
        batch_size = 10000
        self.stdout.write(f"Committing {len(cases_to_create)} cases to DB...")
        Case.objects.bulk_create(cases_to_create, batch_size=batch_size)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully generated {len(cases_to_create)} cases.'))
        self.stdout.write(self.style.SUCCESS('Run `python manage.py compute_summaries` to update the map!'))
