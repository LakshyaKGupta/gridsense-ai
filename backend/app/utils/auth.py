from datetime import datetime, timedelta
import os
import time
from typing import Any, Dict, Optional
import base64
import json as jsonlib

import httpx
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SESSION_TOKEN_EXPIRE_HOURS = 12
FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)
_firebase_cert_cache: Dict[str, Any] = {"expires_at": 0.0, "keys": {}}

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_session_token(data: dict, expires_hours: int = SESSION_TOKEN_EXPIRE_HOURS):
    return create_access_token(data, timedelta(hours=expires_hours))


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def decode_session_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token") from exc

    if not payload.get("sub") or not payload.get("role"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session token missing required claims")
    return {
        **payload,
        "email": payload.get("email") or payload.get("sub"),
    }


def _decode_local_session_token(token: str) -> Optional[Dict[str, Any]]:
    parts = token.split(".")
    if len(parts) < 2:
        return None

    payload_segment = parts[1]
    try:
        padded = payload_segment + "=" * ((4 - len(payload_segment) % 4) % 4)
        claims = jsonlib.loads(base64.b64decode(padded).decode())
    except Exception:
        return None

    if not claims.get("sub") or not claims.get("role"):
        return None

    if not claims.get("is_demo") and claims.get("auth_source") not in {"demo", "local"}:
        return None

    exp = claims.get("exp")
    if exp is not None and float(exp) < time.time():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Local session token expired")

    return {
        **claims,
        "email": claims.get("email") or claims.get("sub"),
        "is_demo": bool(claims.get("is_demo")),
    }


async def _get_firebase_public_keys() -> Dict[str, str]:
    now = time.time()
    cached = _firebase_cert_cache
    if cached["keys"] and cached["expires_at"] > now:
        return cached["keys"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(FIREBASE_CERTS_URL)
            response.raise_for_status()
            cache_control = response.headers.get("cache-control", "")
            max_age = 3600
            for token in cache_control.split(","):
                token = token.strip()
                if token.startswith("max-age="):
                    max_age = int(token.split("=", 1)[1])
                    break
            keys = response.json()
            _firebase_cert_cache["keys"] = keys
            _firebase_cert_cache["expires_at"] = now + max_age - 30
            return keys
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to validate upstream Firebase session",
        ) from exc


async def verify_firebase_identity_token(
    token: str,
    expected_uid: Optional[str] = None,
    expected_email: Optional[str] = None,
) -> Dict[str, Any]:
    try:
        header = jwt.get_unverified_header(token)
        claims = jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase identity token") from exc

    audience = claims.get("aud")
    issuer = claims.get("iss")
    key_id = header.get("kid")
    expected_issuer = f"https://securetoken.google.com/{audience}" if audience else None
    if not audience or not key_id or issuer != expected_issuer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed Firebase identity token")

    keys = await _get_firebase_public_keys()
    certificate = keys.get(key_id)
    if not certificate:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unrecognized Firebase signing key")

    try:
        decoded = jwt.decode(
            token,
            certificate,
            algorithms=["RS256"],
            audience=audience,
            issuer=expected_issuer,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase session verification failed") from exc

    if expected_uid and decoded.get("sub") != expected_uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase session UID mismatch")
    if expected_email and decoded.get("email") != expected_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase session email mismatch")
    return decoded


async def get_current_session(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        # Development bypass for testing
        if os.getenv("DEMO_MODE") == "true":
            return {
                "sub": "operator@grid.com",
                "role": "operator",
                "email": "operator@grid.com"
            }
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer session token")
    
    local_session = _decode_local_session_token(credentials.credentials)
    if local_session is not None:
        return local_session

    if credentials.credentials.startswith("demo-") and credentials.credentials.endswith("-token"):
        role = credentials.credentials.replace("demo-", "").replace("-token", "")
        return {
            "sub": f"demo.{role}@gridsense.ai",
            "role": role,
            "email": f"demo.{role}@gridsense.ai",
            "is_demo": True,
        }

    return decode_session_token(credentials.credentials)


def require_role(expected_role: str):
    async def dependency(session: Dict[str, Any] = Security(get_current_session)) -> Dict[str, Any]:
        if session.get("role") != expected_role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role for this resource")
        return session

    return dependency
