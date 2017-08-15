import csv, re
data = []
with open('Satellite.csv', 'rt') as csvfile:
	reader = csv.DictReader(csvfile)
	data = list(reader)

# Name
# Discipline
# COSPAR ID
# Launch Mass
# Onboard Power
# Launch Date
# Launch Vehicle
# Launch Site
# Periapsis
# Apoapsis
# Period
# Inclination
# Longitude
# Eccentricity

result = []
s_bracket = r"(\[.+\])"
c_bracket = r"(\(.+\))"

for i in data:
	r = {}

	s = i['Name'].replace('\n', ' ')
	s = re.sub(s_bracket, '', s)
	s = s.strip()
	r['Name'] = s

	s = i['Launch Vehicle'].replace('\n', ' ')
	s = re.sub(s_bracket, '', s)
	r['Launch Vehicle'] = s

	s = i['Launch Site'].replace('\n', ' ')
	s = re.sub(s_bracket, '', s)
	r['Launch Site'] = s

	s =  i['Launch Date'].split(',')[0].replace('\n', ' ')
	s = re.sub(s_bracket, '', s)
	r['Launch Date'] = s

	r['Discipline'] = ''
	r['Discipline'] = re.sub(s_bracket, '', i['Discipline'].strip().replace('		', ', ').replace('\n', ''))

	s = ''
	s = re.sub(c_bracket, '',i['Launch Mass'])
	s = re.sub(s_bracket, '', s)
	s = s.replace('kg', '')
	s = s.replace(',', '')
	s = s.strip()
	r['Launch Mass(kg)'] = s

	s = i['Onboard Power']
	s = re.sub(s_bracket, '', s)
	s = s.replace('W', '')
	s = s.replace('~', '')
	s = s.strip()
	r['Onboard Power(W)'] = s

	s = i['Periapsis']
	s = re.sub(s_bracket, '', s)
	s = re.sub(c_bracket, '', s)
	s = s.replace('km', '')
	s = s.replace(',', '')
	s = s.replace('§', '')
	s = s.replace('~', '')
	s = s.strip()
	r['Periapsis(km)'] = s

	s = i['Apoapsis']
	s = re.sub(s_bracket, '', s)
	s = re.sub(c_bracket, '', s)
	s = s.replace('km', '')
	s = s.replace(',', '')
	s = s.replace('§', '')
	s = s.replace('~', '')
	s = s.split('\n')[0]
	s = s.strip()
	r['Apoapsis(km)'] = s

	s = i['Period']
	s = s.replace('min', '')
	s = s.replace('s', '')
	s = s.replace('§', '')
	s = re.sub(s_bracket, '', s)
	s = s.split('\n')[0]
	s = s.strip()
	r['Period(min)'] = s

	s = i['Inclination']
	s = re.sub(s_bracket, '', s)
	s = s.replace('§', '')
	s = s.strip()
	r['Inclination(degrees)'] = s

	s = i['Longitude']
	s = re.sub(s_bracket, '', s)
	s = s.replace('E', '')
	if 'E' in s:
		s = s.replace('E', '')
		s = s.strip()
		r['Longitude(E)'] = s
	elif 'W' in s:
		s = s.replace('W', '')
		s = s.strip()
		r['Longitude(E)'] = '-' + s
		print(r['Longitude(E)'])
	else:
		s = s.replace('E', '')
		s = s.strip()
		r['Longitude(E)'] = s


	s = i['Eccentricity']
	s = re.sub(s_bracket, '', s)
	s = s.strip()
	r['Eccentricity'] = s

	result.append(r)

keys = result[0].keys()
with open('data.csv', 'w') as output_file:
    dict_writer = csv.DictWriter(output_file, keys)
    dict_writer.writeheader()
    dict_writer.writerows(result)
