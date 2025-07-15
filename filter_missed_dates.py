import json

# Read the missed dates
with open("missed_dates.json", "r") as f:
    missed_dates = json.load(f)

# Filter out dates between Nov 6 and March 17 (off-season)
filtered_dates = []
for date_range in missed_dates:
    # Extract start date from the range
    start_date = date_range.split(" to ")[0]
    month_day = start_date[5:]  # Get MM-DD part
    
    # Check if date falls in off-season (Nov 6 - March 17)
    # Nov 6 onwards: >= "11-06"
    # Dec: "12-XX" 
    # Jan: "01-XX"
    # Feb: "02-XX"
    # March 1-17: "03-01" to "03-17"
    
    is_off_season = False
    
    if month_day >= "11-06":  # Nov 6 onwards
        is_off_season = True
    elif month_day.startswith("12-"):  # December
        is_off_season = True
    elif month_day.startswith("01-"):  # January
        is_off_season = True
    elif month_day.startswith("02-"):  # February
        is_off_season = True
    elif month_day.startswith("03-") and month_day <= "03-17":  # March 1-17
        is_off_season = True
    
    if not is_off_season:
        filtered_dates.append(date_range)

# Save the filtered dates to a new file
with open("missed_dates_season_only.json", "w") as f:
    json.dump(filtered_dates, f, indent=2)

print(f"Original missed dates: {len(missed_dates)}")
print(f"Season-only missed dates: {len(filtered_dates)}")
print(f"Removed {len(missed_dates) - len(filtered_dates)} off-season date ranges")