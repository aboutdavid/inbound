import yaml

def add_flights():
    with open('config.yaml', 'r') as file:
        data = yaml.safe_load(file)

    user_name = input("Enter your name: ")
    user_id = input("Enter your slack ID: ")

    user = {'id': user_id, 'name': user_name, 'flights': []}
    data['events'][0]['users'].append(user)  # Add the new user to the first event

    while True:
        flight_code = input("Enter your flight code (or 'q' to quit): ")
        if flight_code.lower() == 'q':
            break
        flight_date = input("Enter your flight date (YYYY-MM-DD): ")

        user['flights'].append({
            'code': flight_code,
            'date': flight_date
        })

    with open('config.yaml', 'w') as file:
        yaml.safe_dump(data, file)

add_flights()