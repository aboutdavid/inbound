# inbound

Slack flight board to see who gets to a hackathon (or whatever) when and at what time.

## how to add your flight

### easy method
1. [Fork this repo](https://github.com/aboutdavid/inbound/fork) and clone it
2. Install pyyaml (`pip3 install pyyaml`)
3. Run the add flight script (`python3 add_flight.py`)
4. Push the repo (`git push`)
5. Make a pull request

```bash
pip3 install pyyaml
```

### advanced method
1. [Fork this repo](https://github.com/aboutdavid/inbound/fork) and clone it
2. Edit `config.yaml` and add a user to the yaml users array in this format:
```yaml
  - flights:
    - code: FLIGHT_CODE
      date: 'YYYY-MM-DD'
    - code: FLIGHT_CODE
      date: 'YYYY-MM-DD'
    id: SLACK_ID
    name: YOUR_NAME_HERE
```
3. Push the repo (`git push`)
4. Make a pull request