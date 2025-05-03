import pandas as pd
import json

# Чтение данных из JSON файла
with open('busyRoomsResult4.txt', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Маппинг дней недели
day_of_week_map = {
    "MON": 1,
    "TUE": 2,
    "WED": 3,
    "THU": 4,
    "FRI": 5,
    "SAT": 6
}

# Маппинг времени на цифры
time_slot_map = {
    "08:30 — 10:00": 1,
    "10:10 — 11:40": 2,
    "11:50 — 13:20": 3,
    "13:50 — 15:20": 4,
    "15:30 — 17:00": 5,
    "17:10 — 18:40": 6,
    "18:50 — 20:20": 7,
    "20:20 — 22:00": 8
}

# Замена значений дисциплин
subj_type_map = {
    "practice": "пр.",
    "lecture": "лек."
}

# Замена EVEN и ODD на 0 и 1
week_type_map = {
    "EVEN": 0,
    "ODD": 1
}

# Обработка данных
schedule_data_updated = []

for entry in data:
    for group in entry.get('groups', []):
        for room in entry.get('rooms', []):
            for teacher in entry.get('teachers', []):
                schedule_data_updated.append({
                    'Group': group['group']['title'],
                    'Day': day_of_week_map.get(entry['dayOfWeek'], 'Unknown'),
                    'TimeSlot': time_slot_map.get(entry['timeSlot']['title'], 'Unknown'),
                    'Aud': room['audience']['title'],
                    'Week': week_type_map.get(entry['weekType'], 'Unknown'),
                    'Name': f"{teacher['teacher']['user']['lastName']} {teacher['teacher']['user']['firstName'][0]}. {teacher['teacher']['user']['middleName'][0]}., {teacher['teacher']['department']['title']}, {teacher['teacher']['position']['title']}",
                    'Subject': entry['assignment']['discipline'],
                    'Subj_type': subj_type_map.get(entry['assignment']['type'], 'Unknown')
                })

# Конвертируем обновленные данные в DataFrame
df_updated = pd.DataFrame(schedule_data_updated)

# Сохранение в CSV файл
df_updated.to_csv('schedule_data_updated.csv', index=False)

print("CSV файл успешно создан!")
