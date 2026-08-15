import os
from google import genai

# کلید خود را مستقیماً وارد کنید
client = genai.Client(api_key="AQ.Ab8RN6LqUEwcrLVwFGnajC6JZ3CqDfZWbVAAcoZvtTG5BxWzog")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="سلام! یک پیام آزمایشی به فارسی بنویس."
)

print(response.text)