import os
import sys
import django
import pandas as pd
import numpy as np
import datetime
from tqdm import tqdm

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "justicewatch.settings")
django.setup()

from django.contrib.auth import get_user_model
from cases.models import Case
from timeline.models import Hearing
from districts.models import District, State

User = get_user_model()

def run_ingestion(sample_size=1000):
    print("Loading data...")

    base_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    keys_path = os.path.join(base_path, "keys")

    state_key = pd.read_csv(os.path.join(keys_path, "cases_state_key.csv"))
    dist_key = pd.read_csv(os.path.join(keys_path, "cases_district_key.csv"))
    type_key = pd.read_csv(os.path.join(keys_path, "type_name_key.csv"))
    disp_key = pd.read_csv(os.path.join(keys_path, "disp_name_key.csv"))
    purpose_key = pd.read_csv(os.path.join(keys_path, "purpose_name_key.csv"))

    print("Loading cases_2018.csv...")
    cases_iter = pd.read_csv(
        os.path.join(base_path, "cases", "cases_2018.csv"),
        chunksize=100000,
        low_memory=False,
    )

    gj_cases = []
    for chunk in cases_iter:
        gj_chunk = chunk[chunk["state_code"] == 17]
        if not gj_chunk.empty:
            gj_cases.append(gj_chunk)

    if not gj_cases:
        print("No Gujarat cases found.")
        return

    df = pd.concat(gj_cases)

    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)

    print(f"Sampled {len(df)} cases for ingestion.")

    type_key_2018 = type_key[type_key["year"] == 2018].drop_duplicates("type_name")
    df = df.merge(
        type_key_2018[["type_name", "type_name_s"]], on="type_name", how="left"
    )

    disp_key_2018 = disp_key[disp_key["year"] == 2018].drop_duplicates("disp_name")
    df = df.merge(
        disp_key_2018[["disp_name", "disp_name_s"]], on="disp_name", how="left"
    )

    purpose_key_2018 = purpose_key[purpose_key["year"] == 2018].drop_duplicates(
        "purpose_name"
    )
    df = df.merge(
        purpose_key_2018[["purpose_name", "purpose_name_s"]],
        on="purpose_name",
        how="left",
    )

    dist_key_2018 = dist_key[
        (dist_key["year"] == 2018) & (dist_key["state_code"] == 17)
    ].drop_duplicates("dist_code")
    df = df.merge(
        dist_key_2018[["dist_code", "district_name"]], on="dist_code", how="left"
    )

    df["date_of_filing"] = pd.to_datetime(df["date_of_filing"], errors="coerce")
    df["date_of_decision"] = pd.to_datetime(df["date_of_decision"], errors="coerce")
    df["date_first_list"] = pd.to_datetime(df["date_first_list"], errors="coerce")
    df["date_last_list"] = pd.to_datetime(df["date_last_list"], errors="coerce")
    df["date_next_list"] = pd.to_datetime(df["date_next_list"], errors="coerce")

    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()

    print("Ingesting records into database...")
    cases_created = 0
    hearings_created = 0

    Case.objects.all().delete()
    District.objects.all().delete()

    for _, row in tqdm(df.iterrows(), total=len(df)):
        if pd.isna(row["date_of_filing"]):
            continue

        state_obj, _ = State.objects.get_or_create(
            name="Gujarat", defaults={"code": "GJ"}
        )
        guja_dist_map = {
            11: "Gandhinagar", 12: "The Dangs", 13: "Ahmedabad", 14: "Surat", 
            15: "Mehsana", 16: "Rajkot", 17: "Amreli", 18: "Anand", 
            19: "Banaskantha", 20: "Bharuch", 21: "Bhavnagar", 22: "Dahod", 
            23: "Jamnagar", 24: "Junagadh", 25: "Kheda", 26: "Kutch", 
            27: "Panchmahal", 28: "Patan", 29: "Sabarkantha", 30: "Surendranagar", 
            31: "Vadodara", 32: "Navsari", 33: "Narmada", 34: "Tapi", 
            35: "Valsad", 36: "Porbandar", 37: "Gir Somnath", 38: "Aravalli", 
            39: "Morbi", 40: "Devbhumi Dwarka", 41: "Chhota Udepur", 
            42: "Mahisagar", 43: "Botad"
        }
        dist_code_val = int(row["dist_code"]) if pd.notna(row["dist_code"]) else None
        if dist_code_val in guja_dist_map:
            dist_name = guja_dist_map[dist_code_val]
        else:
            dist_name = (
                row["district_name"]
                if pd.notna(row["district_name"])
                else f"District {row['dist_code']}"
            )
        district_obj, _ = District.objects.get_or_create(
            name=dist_name,
            defaults={
                "state": state_obj,
                "code": f"GJ-{row['dist_code']}" if pd.notna(row['dist_code']) else "GJ-UNKNOWN",
                "population": 1000000,
            },
        )

        type_s = str(row["type_name_s"]).lower()
        if "cr" in type_s or "criminal" in type_s or "bail" in type_s:
            case_category = "Criminal"
        elif "appeal" in type_s:
            case_category = "Appeal"
        else:
            case_category = "Civil"

        if pd.notna(row["date_of_decision"]):
            status = "Disposed"
        else:
            status = "Pending"

        difficulty_tier = "low"
        if pd.notna(row["date_of_decision"]) and pd.notna(row["date_of_filing"]):
            duration_days = (row["date_of_decision"] - row["date_of_filing"]).days
            if duration_days < 180:
                difficulty_tier = "low"
            elif duration_days < 365:
                difficulty_tier = "medium"
            elif duration_days < 730:
                difficulty_tier = "high"
            else:
                difficulty_tier = "critical"
        else:
            age_days = (datetime.datetime(2018, 12, 31) - row["date_of_filing"]).days
            if age_days > 730:
                difficulty_tier = "critical"
            elif age_days > 365:
                difficulty_tier = "high"
            elif age_days > 180:
                difficulty_tier = "medium"

        case_obj = Case.objects.create(
            case_number=row["ddl_case_id"],
            district=district_obj,
            court_name=(
                f"Court No {row['court_no']}"
                if pd.notna(row["court_no"])
                else "District Court"
            ),
            case_category=case_category,
            crime_type=(
                str(row["type_name_s"])[:99]
                if pd.notna(row["type_name_s"])
                else "Other"
            ),
            applicable_sections="Multiple",  # We could use acts_sections.csv, but keep it simple for now
            filed_date=row["date_of_filing"].date(),
            disposed_date=(
                row["date_of_decision"].date()
                if pd.notna(row["date_of_decision"])
                else None
            ),
            case_status=status,
            num_parties=2,
            difficulty_tier=difficulty_tier,
        )
        cases_created += 1

        if pd.notna(row["date_last_list"]):
            Hearing.objects.create(
                case=case_obj,
                hearing_date=row["date_last_list"].date(),
                purpose=(
                    str(row["purpose_name_s"])[:254]
                    if pd.notna(row["purpose_name_s"])
                    else "Routine Hearing"
                ),
                next_hearing_date=(
                    row["date_next_list"].date()
                    if pd.notna(row["date_next_list"])
                    else None
                ),
                logged_by=admin_user,
            )
            hearings_created += 1

    print(f"\nIngestion Complete!")
    print(f"Cases created: {cases_created}")
    print(f"Hearings created: {hearings_created}")

if __name__ == "__main__":
    run_ingestion(sample_size=1500)
