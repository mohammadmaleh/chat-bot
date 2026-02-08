FROM mcr.microsoft.com/playwright/python:v1.48.0-focal

WORKDIR /app
COPY . .
RUN pip install -r requirements.txt && prisma generate

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
