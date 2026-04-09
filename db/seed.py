from db.session import SessionLocal, engine, Base
from db.models import Order
import datetime

def seed():
    # Recreate tables with new schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Add some mock orders
    mock_orders = [
        Order(customer_email="angry@example.com", product_name="Premium Coffee Machine", status="Delivered"),
        Order(customer_email="common@example.com", product_name="Wireless Keyboard", status="Shipped"),
        Order(customer_email="john@example.com", product_name="Smart Watch", status="In Transit"),
    ]
    
    db.add_all(mock_orders)
    db.commit()
    db.close()
    print("Database re-initialized and seeded with mock orders.")

if __name__ == "__main__":
    seed()
