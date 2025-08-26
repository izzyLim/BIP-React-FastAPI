from pydantic import BaseModel

class WatchlistAdd(BaseModel):
    ticker: str