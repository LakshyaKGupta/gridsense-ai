import asyncio
import json
import os
from typing import Optional, Any
from datetime import datetime, timedelta

# Try to use Redis if available, otherwise use in-memory cache
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# In-memory cache as fallback
in_memory_cache = {}
cache_expiry = {}

if REDIS_AVAILABLE:
    try:
        redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, db=0, decode_responses=True)
        redis_client.ping()
        REDIS_AVAILABLE = True
    except:
        REDIS_AVAILABLE = False

def get_cache(key: str, default: Any = None) -> Any:
    """Get value from cache, return default if not found (sync version)"""
    try:
        if REDIS_AVAILABLE:
            data = redis_client.get(key)
            if data:
                return json.loads(data)
        else:
            # Check in-memory cache
            if key in in_memory_cache:
                expiry_time = cache_expiry.get(key)
                if expiry_time is None or datetime.now() < expiry_time:
                    return in_memory_cache[key]
                else:
                    # Remove expired key
                    del in_memory_cache[key]
                    if key in cache_expiry:
                        del cache_expiry[key]
    except Exception as e:
        print(f"Cache get error: {e}")
    return default

async def async_get_cache(key: str, default: Any = None) -> Any:
    """Get value from cache, return default if not found (async version)"""
    return get_cache(key, default)

def set_cache(key: str, value: Any, expire: int = 3600):
    """Set value in cache with expiration (sync version)"""
    try:
        if REDIS_AVAILABLE:
            redis_client.setex(key, expire, json.dumps(value, default=str))
        else:
            # Store in memory
            in_memory_cache[key] = value
            cache_expiry[key] = datetime.now() + timedelta(seconds=expire)
    except Exception as e:
        print(f"Cache set error: {e}")

async def async_set_cache(key: str, value: Any, expire: int = 3600):
    """Set value in cache with expiration (async version)"""
    return set_cache(key, value, expire)

def delete_cache(key: str):
    """Delete key from cache"""
    try:
        if REDIS_AVAILABLE:
            redis_client.delete(key)
        elif key in in_memory_cache:
            del in_memory_cache[key]
            if key in cache_expiry:
                del cache_expiry[key]
    except Exception as e:
        print(f"Cache delete error: {e}")

def clear_cache_pattern(pattern: str = "*"):
    """Clear all cache keys matching pattern"""
    try:
        if REDIS_AVAILABLE:
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
        else:
            # Simple pattern matching for in-memory cache
            keys_to_delete = []
            if pattern == "*":
                keys_to_delete = list(in_memory_cache.keys())
            else:
                # Simple prefix matching
                prefix = pattern.replace("*", "")
                keys_to_delete = [k for k in in_memory_cache.keys() if k.startswith(prefix)]
            
            for key in keys_to_delete:
                del in_memory_cache[key]
                if key in cache_expiry:
                    del cache_expiry[key]
    except Exception as e:
        print(f"Cache clear error: {e}")
