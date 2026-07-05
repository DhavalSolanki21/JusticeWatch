import re
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from districts.models import State, District
import random

class Command(BaseCommand):
    help = 'Scrapes Indian States and Districts from Wikipedia and populates the database'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Starting Web Scraping for States and Districts..."))
        
        url = "https://en.wikipedia.org/wiki/List_of_districts_in_India"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Failed to fetch data: {e}"))
            return
            
        soup = BeautifulSoup(response.text, 'lxml')
        tables = soup.find_all('table', {'class': 'wikitable'})
        
        state_count = 0
        district_count = 0
        
        for table in tables:
            prev = table.find_previous(['h2', 'h3', 'h4', 'div'])
            while prev and not (prev.name in ['h2', 'h3', 'h4'] or (prev.name == 'div' and 'mw-heading' in prev.get('class', []))):
                prev = prev.find_previous(['h2', 'h3', 'h4', 'div'])
                
            if not prev:
                continue
                
            header_text = prev.text.strip()
            
            # Skip Overview tables
            if 'Overview' in header_text or 'overview' in header_text.lower():
                continue
                
            # Header text usually looks like "Andhra Pradesh (AP)"
            match = re.search(r'^(.*?)\s*\((\w{2})\)$', header_text)
            if match:
                state_name = match.group(1).strip()
                state_code = match.group(2).strip()
            else:
                state_name = header_text
                # Generate a temporary code if none found
                state_code = state_name[:2].upper()
                
            # Create or get state
            state_obj, created = State.objects.get_or_create(
                name=state_name,
                defaults={'code': state_code}
            )
            
            if created:
                state_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created State: {state_name} ({state_code})"))
            
            # Now parse the districts in this table
            rows = table.find_all('tr')
            if len(rows) > 1:
                ths = [th.text.strip().lower() for th in rows[0].find_all(['th', 'td'])]
                
                # Find indices for relevant columns
                dist_idx = -1
                code_idx = -1
                pop_idx = -1
                
                for i, th in enumerate(ths):
                    if 'district' in th:
                        dist_idx = i
                    elif 'code' in th:
                        code_idx = i
                    elif 'population' in th:
                        pop_idx = i
                
                if dist_idx != -1:
                    for row in rows[1:]:
                        cols = row.find_all(['th', 'td'])
                        if len(cols) > dist_idx:
                            district_name = cols[dist_idx].text.strip()
                            # Strip citation brackets like [14]
                            district_name = re.sub(r'\[\d+\]', '', district_name).strip()
                            
                            dist_code = ""
                            if code_idx != -1 and len(cols) > code_idx:
                                dist_code = cols[code_idx].text.strip()
                                dist_code = re.sub(r'\[\d+\]', '', dist_code).strip()
                                
                            if not dist_code:
                                dist_code = district_name[:3].upper()
                                
                            # Ensure code is unique in DB
                            base_code = dist_code
                            counter = 1
                            while District.objects.filter(code=dist_code).exists() and not District.objects.filter(name=district_name).exists():
                                dist_code = f"{base_code}{counter}"
                                counter += 1
                                
                            pop_val = 0
                            if pop_idx != -1 and len(cols) > pop_idx:
                                pop_str = cols[pop_idx].text.strip().replace(',', '')
                                match_pop = re.search(r'(\d+)', pop_str)
                                if match_pop:
                                    pop_val = int(match_pop.group(1))
                            
                            mock_courts = random.randint(1, 10)
                            
                            # If District exists by name, update it to avoid constraint errors
                            try:
                                dist_obj = District.objects.get(name=district_name)
                                d_created = False
                            except District.DoesNotExist:
                                dist_obj = District.objects.create(
                                    name=district_name,
                                    state=state_obj,
                                    code=dist_code,
                                    population=pop_val,
                                    total_courts=mock_courts
                                )
                                d_created = True
                            
                            # If we just want to ensure it has a state
                            if not d_created and dist_obj.state != state_obj:
                                dist_obj.state = state_obj
                                dist_obj.save()
                                
                            if d_created:
                                district_count += 1
                                
        self.stdout.write(self.style.SUCCESS(f"Successfully scraped and ingested {state_count} new States and {district_count} new Districts."))
