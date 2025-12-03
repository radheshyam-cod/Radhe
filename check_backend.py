import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.main import app
    print("Backend imported successfully!")
except Exception as e:
    print(f"Backend import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
