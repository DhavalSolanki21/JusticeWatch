import os
import django
import random
from datetime import timedelta, date
import sys
from faker import Faker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'justicewatch.settings')
django.setup()

from districts.models import District
from cases.models import Case, CaseAssignment
from timeline.models import Hearing
from accounts.models import User

fake = Faker('en_IN')

# Gujarat Districts
GUJARAT_DISTRICTS = [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 
    'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 
    'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 
    'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 
    'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 
    'Tapi', 'Vadodara', 'Valsad'
]

CRIME_TYPES = ['Theft', 'Assault', 'Fraud', 'Cybercrime', 'Property Dispute', 'Divorce', 'Murder', 'Corruption']

def generate_data(num_cases=500):
    print("Generating Districts...")
    # Fetch or create districts in Gujarat
    gujarat_districts_objects = []
    for i, d_name in enumerate(GUJARAT_DISTRICTS):
        d, _ = District.objects.get_or_create(
            name=d_name, 
            defaults={'code': f"GJ{i+1:02d}", 'population': random.randint(500000, 5000000), 'total_courts': random.randint(2, 10)}
        )
        gujarat_districts_objects.append(d)
        
    # Create some Judges and Lawyers
    print("Generating Users (Judges & Lawyers)...")
    judges = []
    lawyers = []
    for i in range(5):
        # Pick a district scope for this judge
        district_for_judge = gujarat_districts_objects[i % len(gujarat_districts_objects)]
        j, _ = User.objects.get_or_create(
            username=f'judge{i}', 
            defaults={
                'role': 'judge', 
                'designation': 'District Judge',
                'full_name': f'Honble Judge {fake.name()}',
                'district_scope': district_for_judge.name,
                'is_verified': True
            }
        )
        if not j.password:
            j.set_password('password123')
            j.save()
        judges.append(j)
        
    for i in range(15):
        l, _ = User.objects.get_or_create(
            username=f'lawyer{i}', 
            defaults={
                'role': 'lawyer', 
                'bar_council_id': f'GBC/{i+1000}/2010',
                'full_name': fake.name(),
                'is_verified': True
            }
        )
        if not l.password:
            l.set_password('password123')
            l.save()
        lawyers.append(l)

    print(f"Generating {num_cases} Cases...")
    for i in range(num_cases):
        district = random.choice(gujarat_districts_objects)
        judge = random.choice(judges)
        crime = random.choice(CRIME_TYPES)
        
        fir_date = fake.date_between(start_date='-5y', end_date='today')
        arrest_date = fir_date + timedelta(days=random.randint(1, 30)) if random.random() > 0.3 else None
        
        # Select status and categories
        status = random.choice(['PRE_CHARGESHEET', 'POST_CHARGESHEET', 'DISPOSED'])
        case_category = 'Criminal' if crime in ['Murder', 'Corruption', 'Theft', 'Assault', 'Fraud', 'Cybercrime'] else 'Civil'
        case_status = 'Disposed' if status == 'DISPOSED' else random.choice(['Pending', 'Stayed'])
        
        status_map = {
            'PRE_CHARGESHEET': 'Not Filed',
            'POST_CHARGESHEET': 'Filed',
            'DISPOSED': 'Trial'
        }
        chargesheet = status_map.get(status, 'Not Filed')
        
        filed_date = fir_date + timedelta(days=random.randint(10, 100))
        disposed_date = filed_date + timedelta(days=random.randint(30, 365)) if case_status == 'Disposed' else None

        c = Case.objects.create(
            case_number=f"GJ-{district.code}-{fake.random_int(min=100000, max=999999)}",
            district=district,
            court_name=f"District Court {district.name}",
            judge=judge,
            case_category=case_category,
            crime_type=crime,
            applicable_sections=f"IPC Section {random.randint(100, 500)}",
            fir_number=f"FIR-{random.randint(1000, 9999)}/{fir_date.year}",
            fir_date=fir_date,
            arrest_date=arrest_date,
            chargesheet_status=chargesheet,
            case_status=case_status,
            filed_date=filed_date,
            disposed_date=disposed_date,
            num_parties=random.randint(2, 6),
            case_notes=fake.paragraph()
        )
        
        # Assigned Lawyer
        CaseAssignment.objects.create(
            case=c,
            lawyer=random.choice(lawyers),
            representing=random.choice(['Petitioner', 'Respondent', 'Defense', 'Prosecution'])
        )
        
        # Generate hearings
        num_hearings = random.randint(1, 10)
        current_date = filed_date + timedelta(days=30)
        for _ in range(num_hearings):
            if current_date > date.today():
                break
            Hearing.objects.create(
                case=c,
                hearing_date=current_date,
                purpose=random.choice(['Framing of Charges', 'Evidence', 'Arguments', 'Bail Hearing', 'Pronouncement of Judgment']),
                outcome_notes=fake.sentence(),
                logged_by=judge
            )
            current_date += timedelta(days=random.randint(15, 60))
            
        # Calculate Difficulty Score and Tier for Case
        days_since_fir = (date.today() - c.fir_date).days if c.fir_date else 0
        actual_hearings = c.hearings.count()
        base_diff = min(1.0, (days_since_fir / 3650) * 0.5 + (actual_hearings / 10) * 0.5)
        if c.crime_type in ['Murder', 'Corruption']:
            base_diff += 0.2
            
        c.difficulty_score = round(min(1.0, max(0.0, base_diff)), 2)
        if c.difficulty_score <= 0.25:
            c.difficulty_tier = 'low'
        elif c.difficulty_score <= 0.50:
            c.difficulty_tier = 'medium'
        elif c.difficulty_score <= 0.75:
            c.difficulty_tier = 'high'
        else:
            c.difficulty_tier = 'critical'
        c.save()

    print("Data generation complete!")

if __name__ == '__main__':
    generate_data(100)
