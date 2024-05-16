import yaml
import re
from datetime import datetime

def is_valid_iata(code):
    return re.fullmatch(r'[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*\d{1,4}', code) is not None
def is_valid_date(date):
    # Check if the date matches the format YYYY-MM-DD
    try:
        datetime.strptime(date, '%Y-%m-%d')
        return True
    except ValueError:
        return False
def add_flights():
    with open('config.yaml', 'r') as file:
        data = yaml.safe_load(file)

    user_name = input("Enter your name: ")
    user_id = input("Enter your user ID: ")

    print("Select an event:")
    for i, event in enumerate(data['events']):
        print(f"{i+1} for {event['name']}")
    while True:
        try:
            event_index = int(input("Enter your choice: ")) - 1
            if 0 <= event_index < len(data['events']):
                break
            else:
                print("Invalid choice. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

    user = {'id': user_id, 'name': user_name, 'flights': []}
    data['events'][event_index]['users'].append(user)

    while True:
        while True:
            flight_code = input("Enter your flight code (or 'q' to quit): ")
            if flight_code.lower() == 'q' or is_valid_iata(flight_code):
                break
            else:
                print("Invalid flight code. Please try again.")
        if flight_code.lower() == 'q':
            break
        while True:
            flight_date = input("Enter your flight date (YYYY-MM-DD): ")
            if is_valid_date(flight_date):
                break
            else:
                print("Invalid date format. Please try again.")

        user['flights'].append({
            'code': flight_code,
            'date': flight_date
        })

    with open('config.yaml', 'w') as file:
        yaml.safe_dump(data, file)

add_flights()