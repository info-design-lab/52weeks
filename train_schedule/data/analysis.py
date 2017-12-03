import csv
import json

metadata = []
data = {}

with open('train_details.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        metadata.append(row)

train_no = []
for i in metadata:
    train_no.append(i['Train No.'])

for i in train_no:
    data[i] = []

for i in metadata:
    d = {}
    d['Station Name'] = i['Station Name'].strip()
    d['Departure time'] = i['Departure time']
    d['Distance'] = i['Distance']
    d['train Name'] = i['train Name']
    data[i['Train No.']].append(d)

sort = {}
city = 'MUMBAI CST'

for i in data:
    k = False
    for j in data[i]:
        if j['Station Name'] == city:
            k = True
    if k:
        sort[i] = data[i]

print(len(sort))

import json
with open('data.json', 'w') as fp:
    json.dump(sort, fp)

'''
print(len(data))
keys = data[0].keys()
with open('data.csv', 'w') as output_file:
    dict_writer = csv.DictWriter(output_file, keys)
    dict_writer.writeheader()
    dict_writer.writerows(data)
'''
