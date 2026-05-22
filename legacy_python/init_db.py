from db.session import SessionLocal, engine, Base
from db.models import Organization, OrganizationConfig, Order, Customer, User, UserRole
import uuid
from core.auth import get_password_hash

def init_test_data():

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    

    org = Organization(
        name="Apple Inc.",
        domain="apple.com",
        company_type="Ecommerce",
        support_email="support@apple.com",
        api_key=f"fd_{uuid.uuid4().hex}"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    

    admin = User(
        organization_id=org.id,
        email="admin@apple.com",
        hashed_password=get_password_hash("girish2910"),
        full_name="Apple Support Admin",
        role=UserRole.ADMIN
    )
    db.add(admin)
    

    config = OrganizationConfig(
        organization_id=org.id,
        max_reply_count=5,
        sentiment_threshold=0.4,
        response_tone="professional"
    )
    db.add(config)
    

    order = Order(
        organization_id=org.id,
        customer_email="biswajitasamal8342@gmail.com",
        product_name="iPhone 15 Pro",
        status="Shipped"
    )
    db.add(order)
    
    db.commit()
    print("-----------------------------------------")
    print("✅ DATABASE INITIALIZED SUCCESSFULLY")
    print(f"Test Organization: {org.name} (ID: {org.id})")
    print(f"Admin Login: admin@apple.com / girish2910")
    print("-----------------------------------------")
    
    db.close()

if __name__ == "__main__":
    init_test_data()
