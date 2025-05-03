import json
import sys

# Проверим, что мы получили от Node.js
print("Received data:", sys.argv[1])

try:
    data = json.loads(sys.argv[1])  # Загружаем строку JSON
    print("Parsed data:", data)  # Печатаем распарсенные данные
except Exception as e:
    print(f"Error parsing JSON: {e}")
