import os
import json
from typing import List, Optional
from pydantic import BaseModel

class Settings(BaseModel):
    project_name: str
    database_url: str
    cors_origins: List[str]
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    request_delay: float = 2.0
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_from_email: str
    smtp_from_name: str = "Hivemind"
    smtp_use_tls: bool = True
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    oauth_redirect_base_url: Optional[str] = None
    frontend_base_url: Optional[str] = None

    class Config:
        env_file = ".env"

def load_settings() -> Settings:
    env = os.getenv("APP_ENV", "development")
    config_path = f"config/config.{env}.json"
    
    try:
        with open(config_path, "r") as f:
            config_data = json.load(f)
        return Settings(**config_data)
    except FileNotFoundError:
        raise RuntimeError(f"Configuration file not found at {config_path}")
    except json.JSONDecodeError:
        raise RuntimeError(f"Invalid JSON in configuration file at {config_path}")

settings = load_settings()
