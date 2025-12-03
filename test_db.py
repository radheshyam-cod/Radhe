import sys
import os
from sqlalchemy import create_engine, text

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

print(f"Testing connection to: {settings.SQLALCHEMY_DATABASE_URI}")

try:
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connection successful:", result.fetchone())
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)
