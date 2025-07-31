"""
Omise Payment Service for GAOJIE Skincare
Handles credit card payments, tokens, and charges
"""

import omise
from flask import current_app
from decimal import Decimal
import logging
from typing import Dict, Optional, Tuple

# Set up logging
logger = logging.getLogger(__name__)

class OmiseService:
    """Service class for handling Omise payments"""
    
    def __init__(self):
        self.secret_key = None
        self.public_key = None
        self.setup_keys()
    
    def setup_keys(self):
        """Setup Omise API keys from Flask config"""
        try:
            self.secret_key = current_app.config.get('OMISE_SECRET_KEY')
            self.public_key = current_app.config.get('OMISE_PUBLIC_KEY')
            
            if not self.secret_key:
                logger.warning("OMISE_SECRET_KEY not found in config")
                return False
                
            # Set the secret key for omise library
            omise.api_secret = self.secret_key
            omise.api_version = current_app.config.get('OMISE_API_VERSION', '2017-11-02')
            
            logger.info("Omise service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to setup Omise keys: {e}")
            return False
    
    def create_token(self, card_data: Dict) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Create a token from card data (this should be done on frontend)
        This method is here for reference - actual token creation happens on frontend
        """
        try:
            token = omise.Token.create(
                card={
                    'name': card_data['name'],
                    'number': card_data['number'],
                    'expiration_month': card_data['exp_month'],
                    'expiration_year': card_data['exp_year'],
                    'security_code': card_data['cvv']
                }
            )
            
            if token['object'] == 'token':
                return True, token, None
            else:
                return False, None, "Failed to create token"
                
        except Exception as e:
            logger.error(f"Token creation failed: {e}")
            return False, None, str(e)
    
    def create_charge(self, amount: int, currency: str, token_id: str, 
                     description: str, metadata: Dict = None) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Create a charge using a token
        
        Args:
            amount: Amount in smallest currency unit (satang for THB)
            currency: Currency code (THB)
            token_id: Token ID from frontend
            description: Charge description
            metadata: Additional metadata
        
        Returns:
            Tuple of (success, charge_data, error_message)
        """
        try:
            if not self.secret_key:
                return False, None, "Omise not configured"
                
            charge_data = {
                'amount': amount,
                'currency': currency,
                'card': token_id,
                'description': description,
                'metadata': metadata or {}
            }
            
            logger.info(f"Creating charge: {charge_data}")
            
            charge = omise.Charge.create(**charge_data)
            
            if charge['object'] == 'charge':
                logger.info(f"Charge created successfully: {charge['id']}")
                return True, charge, None
            else:
                error_msg = charge.get('message', 'Unknown error')
                logger.error(f"Charge creation failed: {error_msg}")
                return False, None, error_msg
                
        except Exception as e:
            logger.error(f"Charge creation failed: {e}")
            return False, None, str(e)
    
    def get_charge(self, charge_id: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Retrieve a charge by ID
        
        Args:
            charge_id: Omise charge ID
            
        Returns:
            Tuple of (success, charge_data, error_message)
        """
        try:
            if not self.secret_key:
                return False, None, "Omise not configured"
                
            charge = omise.Charge.retrieve(charge_id)
            
            if charge['object'] == 'charge':
                return True, charge, None
            else:
                return False, None, "Charge not found"
                
        except Exception as e:
            logger.error(f"Failed to retrieve charge {charge_id}: {e}")
            return False, None, str(e)
    
    def refund_charge(self, charge_id: str, amount: Optional[int] = None) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Refund a charge (partial or full)
        
        Args:
            charge_id: Omise charge ID
            amount: Amount to refund (None for full refund)
            
        Returns:
            Tuple of (success, refund_data, error_message)
        """
        try:
            if not self.secret_key:
                return False, None, "Omise not configured"
                
            charge = omise.Charge.retrieve(charge_id)
            
            refund_data = {}
            if amount:
                refund_data['amount'] = amount
                
            refund = charge.refunds.create(**refund_data)
            
            if refund['object'] == 'refund':
                logger.info(f"Refund created successfully: {refund['id']}")
                return True, refund, None
            else:
                error_msg = refund.get('message', 'Unknown error')
                logger.error(f"Refund creation failed: {error_msg}")
                return False, None, error_msg
                
        except Exception as e:
            logger.error(f"Refund creation failed: {e}")
            return False, None, str(e)
    
    def convert_to_satang(self, amount: float) -> int:
        """Convert Thai Baht to satang (smallest unit)"""
        return int(Decimal(str(amount)) * 100)
    
    def convert_from_satang(self, amount: int) -> float:
        """Convert satang to Thai Baht"""
        return float(Decimal(amount) / 100)
    
    def validate_webhook(self, payload: str, signature: str) -> bool:
        """
        Validate webhook signature (for future webhook implementation)
        """
        try:
            # This would implement webhook signature validation
            # For now, return True (implement proper validation in production)
            return True
        except Exception as e:
            logger.error(f"Webhook validation failed: {e}")
            return False

# Global service instance
omise_service = OmiseService()