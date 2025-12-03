import logging
from app.db.session import SessionLocal
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    db = SessionLocal()
    try:
        # Create Demo Admin
        admin_email = "admin@conceptpulse.ed"
        user = db.query(User).filter(User.phone == admin_email).first()
        if not user:
            logger.info(f"Creating demo admin user: {admin_email}")
            user = User(
                phone=admin_email,
                name="Demo Admin",
                role="admin"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("Demo admin created successfully.")
        else:
            logger.info("Demo admin already exists.")
            
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")
